export function FieldHelp({ text }: { text: string }) {
  return (
    <span className="field-help">
      <button type="button" className="field-help-btn" aria-label="Help">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <text
            x="10"
            y="14.2"
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="700"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fill="currentColor"
          >
            ?
          </text>
        </svg>
      </button>
      <span className="field-help-tip" role="tooltip">
        {text}
      </span>
    </span>
  );
}
