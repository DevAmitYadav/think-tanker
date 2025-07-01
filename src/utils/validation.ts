// by Amit Yadav: Utility for validating node label input using Yup
import * as yup from 'yup';

export const nodeLabelSchema = yup.object({
  label: yup
    .string()
    .trim()
    .min(1, 'Label is required')
    .max(100, 'Label must be at most 100 characters')
    .required('Label is required'),
});
