import { useEffect, useState, useCallback } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";

export type FieldType = "string" | "number" | "boolean";
export interface FieldData {
  key: string;
  type: FieldType;
  value: string | number | boolean;
}

function normalizeFields(input?: FieldData[] | null): FieldData[] {
  if (!input || !Array.isArray(input) || input.length === 0) {
    return [{ key: "", type: "string", value: "" }];
  }
  return input.map((f) => {
    const t: FieldType = (f.type as FieldType) ?? "string";
    let v: string | number | boolean = f.value;
    if (t === "number") {
      const n = Number(v);
      v = Number.isFinite(n) ? n : 0;
    } else if (t === "boolean") {
      v = typeof v === "boolean" ? v : String(v).toLowerCase() === "true";
    } else {
      v = String(v ?? "");
    }
    return { key: f.key ?? "", type: t, value: v };
  });
}

export interface StartNodeRunModalProps {
  opened: boolean;
  initialFields?: FieldData[] | null;
  onClose: () => void;
  onSubmit: (cleaned: FieldData[], objectified: Record<string, string | number | boolean>) => void;
  onSkip?: () => void;
  title?: string;
}

export default function StartNodeRunModal({
  opened,
  initialFields,
  onClose,
  onSubmit,
  onSkip,
  title = "Input for Start Node",
}: StartNodeRunModalProps) {
  const [fields, setFields] = useState<FieldData[]>(normalizeFields(initialFields));

  // Sync khi mở modal với dữ liệu từ parent
  useEffect(() => {
    if (opened) setFields(normalizeFields(initialFields));
  }, [opened, initialFields]);

  const addField = useCallback(() => {
    setFields((fs) => [...fs, { key: "", type: "string", value: "" }]);
  }, []);

  const removeField = useCallback((index: number) => {
    setFields((fs) => (fs.length > 1 ? fs.filter((_, i) => i !== index) : fs));
  }, []);

  const updateFieldKey = useCallback((index: number, key: string) => {
    setFields((fs) => fs.map((f, i) => (i === index ? { ...f, key } : f)));
  }, []);

  const updateFieldType = useCallback((index: number, type: FieldType) => {
    setFields((fs) =>
      fs.map((f, i) => {
        if (i !== index) return f;
        let nextValue: string | number | boolean;
        if (type === "number") {
          const n = Number(f.value);
          nextValue = Number.isFinite(n) ? n : 0;
        } else if (type === "boolean") {
          const b = typeof f.value === "boolean" ? f.value : String(f.value).toLowerCase() === "true";
          nextValue = b;
        } else {
          nextValue = String(f.value ?? "");
        }
        return { ...f, type, value: nextValue };
      })
    );
  }, []);

  const updateFieldValue = useCallback((index: number, raw: string | number | boolean) => {
    setFields((fs) =>
      fs.map((f, i) => {
        if (i !== index) return f;
        if (f.type === "number") {
          const n = typeof raw === "number" ? raw : Number(raw);
          return { ...f, value: Number.isFinite(n) ? n : f.value };
        }
        if (f.type === "boolean") {
          const b = typeof raw === "boolean" ? raw : String(raw).toLowerCase() === "true";
          return { ...f, value: b };
        }
        return { ...f, value: String(raw) };
      })
    );
  }, []);

  const fieldsToObject = (fs: FieldData[]) =>
    fs.reduce<Record<string, string | number | boolean>>((acc, cur) => {
      if (cur.key) acc[cur.key] = cur.value;
      return acc;
    }, {});

  const handleRun = () => {
    const cleaned = fields
      .map((f) => ({
        key: f.key.trim(),
        type: f.type,
        value:
          f.type === "number"
            ? Number(f.value)
            : f.type === "boolean"
            ? Boolean(f.value)
            : String(f.value),
      }))
      .filter((f) => f.key);

    // validate number
    for (const f of cleaned) {
      if (f.type === "number" && !Number.isFinite(f.value as number)) {
        alert(`Giá trị số không hợp lệ cho key "${f.key}".`);
        return;
      }
    }
    // check duplicate keys
    const keys = cleaned.map((f) => f.key);
    const dup = keys.find((k, i) => keys.indexOf(k) !== i);
    if (dup) {
      alert(`Field "${dup}" đang bị trùng key.`);
      return;
    }

    onSubmit(cleaned, fieldsToObject(cleaned));
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg" centered>
      <Stack gap="md">
        {fields.map((field, index) => (
          <Group key={index} align="flex-end" wrap="nowrap">
            <TextInput
              label={index === 0 ? "Field Name" : ""}
              placeholder="Enter field name"
              value={field.key}
              onChange={(e) => updateFieldKey(index, e.target.value)}
              style={{ flex: 1 }}
            />

            <Select
              label={index === 0 ? "Type" : ""}
              data={[
                { value: "string", label: "string" },
                { value: "number", label: "number" },
                { value: "boolean", label: "boolean" },
              ]}
              value={field.type}
              onChange={(v) => v && updateFieldType(index, v as FieldType)}
              style={{ width: 140 }}
              comboboxProps={{ withinPortal: true }}
            />

            {field.type === "string" && (
              <TextInput
                label={index === 0 ? "Value" : ""}
                placeholder="Enter value"
                value={String(field.value ?? "")}
                onChange={(e) => updateFieldValue(index, e.target.value)}
                style={{ flex: 1 }}
              />
            )}

            {field.type === "number" && (
              <NumberInput
                label={index === 0 ? "Value" : ""}
                placeholder="Enter number"
                value={typeof field.value === "number" ? field.value : Number(field.value || 0)}
                onChange={(val) => {
                  const num = typeof val === "number" ? val : val === null ? null : Number(val);
                  updateFieldValue(index, num === null ? 0 : Number.isFinite(num) ? num : 0);
                }}
                style={{ flex: 1 }}
                thousandSeparator
                hideControls
              />
            )}

            {field.type === "boolean" && (
              <div style={{ flex: 1 }}>
                {index === 0 && (
                  <div className="mantine-Text-root mantine-InputWrapper-label">Value</div>
                )}
                <SegmentedControl
                  value={String(Boolean(field.value))}
                  onChange={(v) => updateFieldValue(index, v === "true")}
                  data={[
                    { label: "true", value: "true" },
                    { label: "false", value: "false" },
                  ]}
                  fullWidth
                />
              </div>
            )}

            {fields.length > 1 && (
              <ActionIcon color="red" variant="light" onClick={() => removeField(index)} aria-label="remove field">
                <Trash2 size={16} />
              </ActionIcon>
            )}
          </Group>
        ))}

        <Button variant="filled" leftSection={<Plus size={16} />} onClick={addField} color="violet">
          Add More Field
        </Button>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          {onSkip && (
            <Button variant="subtle" onClick={onSkip}>
              Run without values
            </Button>
          )}
          <Button color="violet" onClick={handleRun}>
            Run
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
