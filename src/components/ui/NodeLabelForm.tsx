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
          className="rounded-full px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          disabled={isSubmitting || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="rounded-full px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-400/60 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default NodeLabelForm;
