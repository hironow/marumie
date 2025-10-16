import "server-only";
import LegalPageLayout, {
  Paragraph,
  SubSectionTitle,
  List,
} from "@/client/components/layout/LegalPageLayout";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="プライバシーポリシー">
      <div className="space-y-6"></div>
    </LegalPageLayout>
  );
}
