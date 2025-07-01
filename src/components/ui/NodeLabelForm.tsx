// by Amit Yadav: Node label edit form using React Hook Form + Yup
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { nodeLabelSchema } from '../../utils/validation';

interface NodeLabelFormProps {
  initialLabel: string;
  onSubmit: (label: string) => void;
  onCancel: () => void;
}

const NodeLabelForm: React.FC<NodeLabelFormProps> = ({ initialLabel, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { label: initialLabel },
    resolver: yupResolver(nodeLabelSchema),
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data.label))} className="flex flex-col items-center w-full">
      <input
        {...register('label')}
        className="text-center w-full bg-transparent border-b border-blue-400 focus:outline-none text-gray-800 text-sm font-medium"
        autoFocus
      />
      {errors.label && <span className="text-xs text-red-600 mt-1">{errors.label.message as string}</span>}
      <div className="flex space-x-2 mt-2">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>Save</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default NodeLabelForm;
