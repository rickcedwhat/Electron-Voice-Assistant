interface Format {
  isBold?: boolean;
  newLineAfter?: boolean;
  textAlign?: 'left' | 'center' | 'right';
}

interface BaseProblemPart {
  type: 'text' | 'input' | 'answer_placeholder' | 'table' | 'table_row';
  value: string | number | null | TableRowPart;
  id?: string;
  format?: Format;
}

interface TablePart {
  type: 'table';
  value: TableRowPart[];
}

interface TableRowPart {
  type: 'table_row';
  value: (TextPart | InputPart | AnswerPartNumerical | AnswerPartText)[];
  isHeader?: boolean;
}

interface TextPart extends BaseProblemPart {
  type: 'text';
  value: string;
}

interface InputPart extends BaseProblemPart {
  type: 'input';
  value: string | number;
  id: string;
}

interface AnswerPart extends BaseProblemPart {
  type: 'answer_placeholder';
  value: string | number | null;
  id: string;
}

interface AnswerPartNumerical extends AnswerPart {
  type: 'answer_placeholder';
  value: number | null;
}

interface AnswerPartText extends AnswerPart {
  type: 'answer_placeholder';
  value: string | null;
}

// js_fn will be executed in the scope to determine the correct option
// js_fn can reference any Part with an id (input or previous answers)
interface FormulaMC {
  [key: string]: {
    options: { id: string; text: string }[];
    js_fn: string;
  };
}

interface Formula {
  [key: string]: {
    decimals?: number;
    js_fn: string;
  };
}

interface InputJSON {
  title: string;
  problem_parts: (TextPart | InputPart | AnswerPartNumerical | AnswerPartText | TablePart)[];
  formulas: (Formula | FormulaMC)[];
}
