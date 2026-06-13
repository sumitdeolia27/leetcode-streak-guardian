'use client';

interface TimePicker12Props {
  value: string;
  onChange: (value: string) => void;
}

function toParts(value: string) {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour24 = Number(hourRaw || '21');
  const minute = minuteRaw || '00';
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  return {
    hour: String(hour12),
    minute,
    period,
  };
}

function toTime24(hour: string, minute: string, period: string) {
  let hourNumber = Number(hour);

  if (period === 'AM') {
    hourNumber = hourNumber === 12 ? 0 : hourNumber;
  } else {
    hourNumber = hourNumber === 12 ? 12 : hourNumber + 12;
  }

  return `${String(hourNumber).padStart(2, '0')}:${minute}`;
}

export default function TimePicker12({ value, onChange }: TimePicker12Props) {
  const parts = toParts(value);
  const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const minutes = Array.from({ length: 12 }, (_, index) =>
    String(index * 5).padStart(2, '0')
  );

  const update = (next: Partial<typeof parts>) => {
    const merged = { ...parts, ...next };
    onChange(toTime24(merged.hour, merged.minute, merged.period));
  };

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
      <select
        value={parts.hour}
        onChange={(e) => update({ hour: e.target.value })}
        className="w-full px-3 py-3 rounded-lg input-dark"
        aria-label="Hour"
      >
        {hours.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>

      <select
        value={parts.minute}
        onChange={(e) => update({ minute: e.target.value })}
        className="w-full px-3 py-3 rounded-lg input-dark"
        aria-label="Minute"
      >
        {minutes.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>

      <select
        value={parts.period}
        onChange={(e) => update({ period: e.target.value })}
        className="w-full px-3 py-3 rounded-lg input-dark"
        aria-label="AM or PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
