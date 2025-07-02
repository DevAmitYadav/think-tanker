// by Amit Yadav: Node label edit form using React Hook Form + Yup
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { nodeLabelSchema } from '../../utils/validation';

interface NodeLabelFormProps {
  initialLabel: string;
  onSubmit: (label: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}


const NodeLabelForm: React.FC<NodeLabelFormProps> = ({ initialLabel, onSubmit, onCancel, isSaving }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { label: initialLabel },
    resolver: yupResolver(nodeLabelSchema),
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data.label))} className="flex flex-col items-center w-full">
      <input
        {...register('label')}
        className="text-center w-full bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-2xl shadow text-zinc-900 dark:text-zinc-100 text-lg font-semibold px-4 py-3 transition-all duration-150 outline-none"
        style={{ minWidth: 160, maxWidth: 260, minHeight: 44, height: 48, marginBottom: 8, letterSpacing: 0.2, boxShadow: '0 2px 8px #e0e7ff' }}
        autoFocus
      />
      {errors.label && <span className="text-xs text-red-600 mt-1">{errors.label.message as string}</span>}
      <div className="flex space-x-2 mt-3">
        <button
          type="submit"
          className="rounded-md w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400/60 text-base"
          disabled={isSubmitting || isSaving}
          title="Save"
        >
          {isSaving ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          )}
        </button>
        <button
          type="button"
          className="rounded-md w-9 h-9 flex items-center justify-center bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-400/60 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 text-base"
          onClick={onCancel}
          disabled={isSaving}
          title="Cancel"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </form>
  );
};

export default NodeLabelForm;
