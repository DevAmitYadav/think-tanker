// by Amit Yadav: Node label edit form using React Hook Form + Yup
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface NodeLabelFormProps {
  initialLabel: string;
  onSubmit: (label: string) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

const NodeLabelForm: React.FC<NodeLabelFormProps> = ({
  initialLabel,
  onSubmit,
  onCancel,
  isSaving = false
}) => {
  const [label, setLabel] = useState(initialLabel);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Validation function
  const validateLabel = (value: string): boolean => {
    if (!value.trim()) {
      setErrorMessage('Label cannot be empty');
      return false;
    }
    if (value.length > 100) {
      setErrorMessage('Label must be less than 100 characters');
      return false;
    }
    if (/^\s+$/.test(value)) {
      setErrorMessage('Label cannot contain only whitespace');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLabel(value);
    setIsValid(validateLabel(value));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isSaving) {
      await onSubmit(label.trim());
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isValid && !isSaving) {
        onSubmit(label.trim());
      }
    }
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={label}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full px-3 py-2 text-sm font-medium",
            "bg-white border-2 rounded-lg shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "transition-all duration-200",
            "placeholder-gray-400",
            isValid 
              ? "border-gray-300 focus:border-blue-500" 
              : "border-red-300 focus:border-red-500 focus:ring-red-500"
          )}
          placeholder="Enter node label..."
          maxLength={100}
          disabled={isSaving}
        />
        
        {/* Character count */}
        <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
          {label.length}/100
        </div>

        {/* Error message */}
        <AnimatePresence>
          {!isValid && errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-8 left-0 text-xs text-red-600 font-medium"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 mt-8">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          size="sm"
          disabled={isSaving}
          className="h-8 px-3"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={!isValid || isSaving}
          size="sm"
          className="h-8 px-3"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Press Enter to save, Esc to cancel
      </div>
    </motion.form>
  );
};

export default NodeLabelForm;
