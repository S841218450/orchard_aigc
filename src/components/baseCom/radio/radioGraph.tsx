import "./radioGraph.scss";
const RadioGraph = ({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="radio-inputs">
      {options.map((item) => (
        <div className="radio" key={item.value}>
          <input
            type="radio"
            name="radio"
            value={item.value}
            checked={item.value === value}
            onChange={() => onChange(item.value)}
          />
          <span className="name" onClick={() => onChange(item.value)}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};
export default RadioGraph;
