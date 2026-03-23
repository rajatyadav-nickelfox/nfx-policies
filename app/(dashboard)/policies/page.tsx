import { PolicyList } from '@/features/policies/components/PolicyList';

export const metadata = { title: 'Policies — NFX' };

export default function PoliciesPage() {
  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Company Policies</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Read and acknowledge all required policy documents.
        </p>
      </div>
      <PolicyList />
    </div>
  );
}
