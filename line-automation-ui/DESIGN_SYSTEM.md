# Design System - LINE Automation UI

## ภาพรวม

Design System นี้ถูกออกแบบมาเพื่อให้เรียบง่าย ใช้งานง่าย และพัฒนาเพิ่มเติมได้สะดวก โดยใช้หลักการ:

- **เรียบง่าย**: ใช้สีและ typography ที่สอดคล้องกัน
- **ใช้งานง่าย**: Component มี API ที่เข้าใจง่าย
- **พัฒนาเพิ่มเติมได้**: ใช้ Tailwind CSS และ CVA สำหรับความยืดหยุ่น

## สี (Colors)

### Primary Colors
- `--primary-50`: #eff6ff (สีฟ้าอ่อนมาก)
- `--primary-500`: #3b82f6 (สีฟ้าหลัก)
- `--primary-600`: #2563eb (สีฟ้าเข้ม)

### Status Colors
- **Success**: เขียว (#22c55e)
- **Warning**: เหลือง (#f59e0b)
- **Error**: แดง (#ef4444)

### Gray Scale
- `--gray-50` ถึง `--gray-900` สำหรับข้อความและพื้นหลัง

## Typography

### Font Family
- Primary: Inter
- Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

### Font Sizes
- `--font-size-xs`: 0.75rem
- `--font-size-sm`: 0.875rem
- `--font-size-base`: 1rem
- `--font-size-lg`: 1.125rem
- `--font-size-xl`: 1.25rem

## Spacing

- `--spacing-xs`: 0.25rem
- `--spacing-sm`: 0.5rem
- `--spacing-md`: 1rem
- `--spacing-lg`: 1.5rem
- `--spacing-xl`: 2rem

## Border Radius

- `--radius-sm`: 0.375rem
- `--radius-md`: 0.5rem
- `--radius-lg`: 0.75rem
- `--radius-xl`: 1rem

## Components

### Button

```tsx
import { Button } from '@/components/ui';

// Basic usage
<Button>คลิก</Button>

// Variants
<Button variant="primary">หลัก</Button>
<Button variant="secondary">รอง</Button>
<Button variant="outline">เส้นขอบ</Button>
<Button variant="ghost">โปร่งใส</Button>
<Button variant="success">สำเร็จ</Button>
<Button variant="warning">เตือน</Button>
<Button variant="danger">อันตราย</Button>

// Sizes
<Button size="xs">เล็กมาก</Button>
<Button size="sm">เล็ก</Button>
<Button size="md">กลาง</Button>
<Button size="lg">ใหญ่</Button>
<Button size="xl">ใหญ่มาก</Button>

// With icons
<Button leftIcon={<PlusIcon />}>เพิ่ม</Button>
<Button rightIcon={<ArrowRightIcon />}>ถัดไป</Button>

// Loading state
<Button isLoading>กำลังโหลด</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>หัวข้อ</CardTitle>
    <CardDescription>คำอธิบาย</CardDescription>
  </CardHeader>
  <CardContent>
    เนื้อหา
  </CardContent>
  <CardFooter>
    <Button>ดำเนินการ</Button>
  </CardFooter>
</Card>

// Variants
<Card variant="default">ปกติ</Card>
<Card variant="elevated">ยกขึ้น</Card>
<Card variant="outlined">เส้นขอบ</Card>
<Card variant="ghost">โปร่งใส</Card>

// Interactive
<Card interactive>คลิกได้</Card>
```

### Input

```tsx
import { Input } from '@/components/ui';

<Input 
  label="ชื่อผู้ใช้"
  placeholder="กรอกชื่อผู้ใช้"
  helperText="ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"
/>

// With icons
<Input 
  leftIcon={<UserIcon />}
  placeholder="ชื่อผู้ใช้"
/>

// Error state
<Input 
  error="กรุณากรอกชื่อผู้ใช้"
  variant="error"
/>
```

### Textarea

```tsx
import { Textarea } from '@/components/ui';

<Textarea 
  label="ข้อความ"
  placeholder="กรอกข้อความ"
  maxLength={500}
  showCharCount
/>
```

### Badge

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success" dot>พร้อมใช้งาน</Badge>
<Badge variant="warning">รอดำเนินการ</Badge>
<Badge variant="error">ข้อผิดพลาด</Badge>
```

### Loading

```tsx
import { Loading, Spinner, PageLoading } from '@/components/ui';

// Basic loading
<Loading text="กำลังโหลด..." />

// Inline spinner
<Spinner size="sm" />

// Full page loading
<PageLoading text="กำลังโหลดข้อมูล..." />
```

## การใช้งาน Class Variance Authority (CVA)

เราใช้ CVA เพื่อจัดการ variants ของ components:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        primary: 'primary-classes',
        secondary: 'secondary-classes',
      },
      size: {
        sm: 'small-classes',
        md: 'medium-classes',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

## การปรับแต่ง (Customization)

### เพิ่ม Variant ใหม่

```tsx
// ใน component file
const buttonVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        // เพิ่ม variant ใหม่
        info: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      },
    },
  }
);
```

### Override Styles

```tsx
// ใช้ className prop
<Button className="custom-styles">
  ปุ่มที่ปรับแต่ง
</Button>
```

## Best Practices

1. **ใช้ Design Tokens**: ใช้ CSS variables แทนการ hardcode สี
2. **Consistent Spacing**: ใช้ spacing scale ที่กำหนดไว้
3. **Accessible**: ใส่ aria-labels และ focus states
4. **Responsive**: ใช้ responsive utilities ของ Tailwind
5. **Performance**: ใช้ React.forwardRef และ displayName

## การพัฒนาต่อ

### เพิ่ม Component ใหม่

1. สร้างไฟล์ใน `src/app/components/ui/`
2. ใช้ CVA สำหรับ variants
3. ใช้ `cn()` utility สำหรับ class merging
4. เพิ่ม TypeScript types
5. Export ใน `index.ts`

### การทดสอบ

```bash
# รันแอปพลิเคชัน
npm run dev

# ตรวจสอบ TypeScript
npm run type-check

# ตรวจสอบ Linting
npm run lint
``` 