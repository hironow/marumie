import "server-only";
import LegalPageLayout, {
  Paragraph,
  SubSectionTitle,
  List,
} from "@/client/components/layout/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout title="利用規約">
      <div className="space-y-6"></div>
    </LegalPageLayout>
  );
}
