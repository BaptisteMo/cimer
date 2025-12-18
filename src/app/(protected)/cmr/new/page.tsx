import { CmrFormWizard } from '@/components/cmr/cmr-form-wizard';

export const metadata = {
  title: 'New CMR | CMR Digital',
  description: 'Create a new CMR transport document',
};

export default function NewCmrPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New CMR Document</h1>
        <p className="text-muted-foreground">
          Follow the steps to create your transport document
        </p>
      </div>

      <CmrFormWizard />
    </div>
  );
}
