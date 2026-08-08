import "./radioGraph.scss";
const RadioGraph = ({
  options,
  value,
  onChange,
  name,
}: {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (value: string | number) => void;
  name: string;
}) => {
  return (
    <div className="radio-inputs">
      {options.map((item) => (
        <div className="radio" key={item.value}>
          <input
            type="radio"
            name={name}
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
