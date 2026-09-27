export function FieldHelp({ text }: { text: string }) {
  return (
    <span className="field-help">
      <span className="field-help-btn" aria-label="Help">
        ?
      </span>
      <span className="field-help-tip" role="tooltip">
        {text}
      </span>
    </span>
  );
}
