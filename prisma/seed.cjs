const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create political organizations
    await seedPoliticalOrganizations();

    // Create admin user for local development
    await seedAdminUser();

    // Add settings and minimal household scaffold (add-only)
    await ensureOrganizationSettings();
    await seedHouseholdSample();

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

// Political organizations seeding function
async function seedPoliticalOrganizations() {
    console.log('Creating political organizations...');

    // 政治組織データの定義
    const organizations = [
        {
            displayName: '政党・チームみらい',
            orgName: null,
            slug: 'team-mirai',
            description: 'チームみらい（Team Mirai）は、日本の政党。2024年東京都知事選挙でAIエンジニアの安野貴博のもとに集まった「チーム安野」を前身として、2025年5月8日に設立された。安野が党首を務めている。第27回参議院議員通常選挙において政党要件を満たし、国政政党となった。公職選挙法における略称は「みらい」。',
        },
        {
            displayName: '党首・安野の政治団体',
            orgName: 'デジタル民主主義を考える会',
            slug: 'digimin',
            description: '安野たかひろの政治団体です',
        }
    ];

    // 政治組織を作成（既存チェック付き）
    for (const orgData of organizations) {
        const existing = await prisma.politicalOrganization.findFirst({
            where: { slug: orgData.slug }
        });

        if (!existing) {
            const created = await prisma.politicalOrganization.create({
                data: orgData
            });
            console.log('Created political organization:', created);
        } else {
            console.log('Political organization already exists:', existing);
        }
    }
}

// Ensure each political organization has an OrganizationSetting (default: political)
async function ensureOrganizationSettings() {
    console.log('Ensuring organization settings...');
    const orgs = await prisma.politicalOrganization.findMany();

    for (const org of orgs) {
        const existing = await prisma.organizationSetting.findUnique({
            where: { politicalOrganizationId: org.id }
        }).catch(() => null);

        if (!existing) {
            await prisma.organizationSetting.create({
                data: {
                    politicalOrganizationId: org.id,
                    orgType: 'political',
                    mappingProfile: 'political-default',
                    features: { csvProfiles: ['political-mf'], enabled: [] }
                }
            });
            console.log(`  ✔ Created organization_setting for '${org.slug}' (political)`);
        }
    }
}

// Create a minimal Household sample (new org + settings + basic accounts/budgets)
async function seedHouseholdSample() {
    console.log('Creating household sample...');

    // 1) Create or reuse organization as household container
    const slug = 'household-sample';
    let householdOrg = await prisma.politicalOrganization.findUnique({ where: { slug } });
    if (!householdOrg) {
        householdOrg = await prisma.politicalOrganization.create({
            data: {
                displayName: '家庭（サンプル）',
                orgName: null,
                slug,
                description: '家計/世帯機能の検証用サンプル組織（最小データ）',
            }
        });
        console.log(`  ✔ Created organization '${slug}'`);
    } else {
        console.log(`  • Organization '${slug}' already exists`);
    }

    // 2) Mark as household
    const setting = await prisma.organizationSetting.findUnique({
        where: { politicalOrganizationId: householdOrg.id }
    }).catch(() => null);
    if (!setting) {
        await prisma.organizationSetting.create({
            data: {
                politicalOrganizationId: householdOrg.id,
                orgType: 'household',
                mappingProfile: 'household-default',
                features: { csvProfiles: ['household-mf', 'bank-generic'], enabled: ['budgets','accounts'] }
            }
        });
        console.log('  ✔ Marked as household with default mapping profile');
    }

    // 3) Create minimal accounts
    const existingAccounts = await prisma.account.findMany({
        where: { politicalOrganizationId: householdOrg.id }
    });

    if (existingAccounts.length === 0) {
        const mainBank = await prisma.account.create({
            data: {
                politicalOrganizationId: householdOrg.id,
                name: 'メイン銀行',
                type: 'bank',
                institution: 'Sample Bank',
                currency: 'JPY',
                isActive: true,
            }
        });
        const creditCard = await prisma.account.create({
            data: {
                politicalOrganizationId: householdOrg.id,
                name: 'クレジットカード',
                type: 'credit_card',
                institution: 'Sample Card',
                currency: 'JPY',
                isActive: true,
            }
        });

        const today = new Date();
        const asOfDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        await prisma.accountSnapshot.createMany({
            data: [
                { accountId: mainBank.id, asOfDate, balance: 100000 },
                { accountId: creditCard.id, asOfDate, balance: -30000 },
            ],
            skipDuplicates: true,
        });
        console.log('  ✔ Created sample accounts & snapshots');
    } else {
        console.log('  • Accounts already exist, skipping');
    }

    // 4) Create minimal budgets for current month
    const ym = new Date().toISOString().slice(0,7); // YYYY-MM
    const existingBudgets = await prisma.budget.findMany({
        where: { politicalOrganizationId: householdOrg.id, yearMonth: ym }
    });
    if (existingBudgets.length === 0) {
        await prisma.budget.createMany({
            data: [
                { politicalOrganizationId: householdOrg.id, yearMonth: ym, categoryKey: 'house.rent',     amount: 120000 },
                { politicalOrganizationId: householdOrg.id, yearMonth: ym, categoryKey: 'house.utilities', amount: 20000 },
                { politicalOrganizationId: householdOrg.id, yearMonth: ym, categoryKey: 'house.food',      amount: 50000 },
            ],
            skipDuplicates: true,
        });
        console.log(`  ✔ Created sample budgets for ${ym}`);
    } else {
        console.log(`  • Budgets already exist for ${ym}, skipping`);
    }

    // 5) Attach one admin user as household owner (if available)
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (adminUser) {
        const existingMember = await prisma.householdMember.findFirst({
            where: { politicalOrganizationId: householdOrg.id, userId: adminUser.id }
        });
        if (!existingMember) {
            await prisma.householdMember.create({
                data: {
                    politicalOrganizationId: householdOrg.id,
                    userId: adminUser.id,
                    name: adminUser.email || 'Owner',
                    role: 'owner',
                }
            });
            console.log('  ✔ Linked admin user as household owner');
        }
    } else {
        console.log('  ⚠ No admin user found; skipping household member link');
    }
}

// Admin user seeding function
async function seedAdminUser() {
    console.log('Creating admin user...');

    // Default credentials for local development
    const ADMIN_EMAIL = 'foo@example.com';
    const ADMIN_PASSWORD = 'foo@example.com';
    const USER_EMAIL = 'bar@example.com';
    const USER_PASSWORD = 'bar@example.com';

    // Get Supabase configuration from environment variables
    const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        console.log('⚠️  Warning: SUPABASE_SERVICE_ROLE_KEY not found - skipping admin user creation');
        console.log('   To create admin user, ensure SUPABASE_SERVICE_ROLE_KEY is set in .env');
        return;
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // Check if user already exists
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`);
        }

        // Check for existing users
        const existingAdmin = existingUsers.users?.find(user => user.email === ADMIN_EMAIL);
        const existingUser = existingUsers.users?.find(user => user.email === USER_EMAIL);

        // Create admin user
        if (existingAdmin) {
            console.log(`✅ Admin user '${ADMIN_EMAIL}' already exists in Supabase`);

            const existingDbAdmin = await prisma.user.findUnique({
                where: { authId: existingAdmin.id }
            });

            if (!existingDbAdmin) {
                await prisma.user.create({
                    data: {
                        authId: existingAdmin.id,
                        email: ADMIN_EMAIL,
                        role: 'admin'
                    }
                });
                console.log('✅ Database admin record created');
            }
        } else {
            const { data: newAdmin, error: adminError } = await supabase.auth.admin.createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                email_confirm: true,
            });

            if (adminError) {
                throw new Error(`Failed to create admin: ${adminError.message}`);
            }

            await prisma.user.create({
                data: {
                    authId: newAdmin.user.id,
                    email: ADMIN_EMAIL,
                    role: 'admin'
                }
            });
            console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
        }

        // Create regular user
        if (existingUser) {
            console.log(`✅ Regular user '${USER_EMAIL}' already exists in Supabase`);

            const existingDbUser = await prisma.user.findUnique({
                where: { authId: existingUser.id }
            });

            if (!existingDbUser) {
                await prisma.user.create({
                    data: {
                        authId: existingUser.id,
                        email: USER_EMAIL,
                        role: 'user'
                    }
                });
                console.log('✅ Database user record created');
            }
        } else {
            const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
                email: USER_EMAIL,
                password: USER_PASSWORD,
                email_confirm: true,
            });

            if (userError) {
                throw new Error(`Failed to create user: ${userError.message}`);
            }

            await prisma.user.create({
                data: {
                    authId: newUser.user.id,
                    email: USER_EMAIL,
                    role: 'user'
                }
            });
            console.log(`✅ Regular user created: ${USER_EMAIL}`);
        }

        console.log('✅ User seeding completed!');
        console.log(`   Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
        console.log(`   User: ${USER_EMAIL} / ${USER_PASSWORD}`);
        console.log('   You can now log in to the admin panel at http://localhost:3001/login');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        console.log('   Admin user creation failed, but database seeding will continue');
    }
}
