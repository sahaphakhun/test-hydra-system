'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useWebSocket } from '../contexts/WebSocketContext';
import { registerLineAccount, submitOtp } from '../services/api';
import { LineAccount } from '../types';

// กำหนด Schema สำหรับการตรวจสอบข้อมูลฟอร์ม
const registerFormSchema = z.object({
  displayName: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  phoneNumber: z.string().min(10, 'เบอร์โทรศัพท์ไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  proxy: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const RegisterPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [accounts, setAccounts] = useState<LineAccount[]>([]);

  const { status, statusMessage } = useWebSocket();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
  });

  // ดึงข้อมูล accounts จาก localStorage เมื่อ component ติดตั้ง
  useEffect(() => {
    const storedAccounts = localStorage.getItem('accounts');
    if (storedAccounts) {
      setAccounts(JSON.parse(storedAccounts));
    }
  }, []);

  // บันทึกข้อมูล accounts ทุกครั้งที่มีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }, [accounts]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await registerLineAccount(data);
      // เพิ่มบัญชีใหม่ใน state
      const newAccount: LineAccount = {
        id: data.phoneNumber,
        phoneNumber: data.phoneNumber,
        displayName: data.displayName,
        createdAt: new Date().toISOString(),
        status: 'inactive',
      };
      setAccounts(prev => [...prev, newAccount]);
      setIsModalOpen(false);
      setIsOtpModalOpen(true);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการสมัครบัญชี:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setIsLoading(true);
    try {
      await submitOtp(otp);
      setIsOtpModalOpen(false);
      // หลังจากส่ง OTP สำเร็จ ควรจะโหลดรายการบัญชีใหม่
      // ในกรณีนี้เราจะแค่ reset form
      reset();
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่ง OTP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title="สมัครสมาชิก LINE"
      subtitle="สร้างบัญชี LINE ใหม่สำหรับระบบ Automation"
    >
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          เพิ่มบัญชีใหม่
        </Button>
      </div>

      {/* แสดงรายการบัญชี */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold">{account.displayName}</h3>
                <p className="text-gray-500">{account.phoneNumber}</p>
                <div className="mt-2 flex items-center">
                  <span
                    className={`inline-block h-2 w-2 rounded-full mr-2 ${
                      account.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></span>
                  <span className="text-sm">
                    {account.status === 'active' ? 'กำลังใช้งาน' : 'ไม่ได้ใช้งาน'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">ยังไม่มีบัญชี LINE ที่ลงทะเบียนไว้</p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">
            เพิ่มบัญชีใหม่
          </Button>
        </div>
      )}

      {/* Modal สำหรับเพิ่มบัญชีใหม่ */}
      <Modal
        open={isModalOpen}
        onClose={() => !isLoading && setIsModalOpen(false)}
        title="เพิ่มบัญชี LINE ใหม่"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="ชื่อที่แสดง"
            placeholder="ชื่อที่แสดงในบัญชี LINE"
            fullWidth
            {...register('displayName')}
            error={errors.displayName?.message}
          />
          <Input
            label="เบอร์โทรศัพท์"
            placeholder="เบอร์โทรศัพท์สำหรับลงทะเบียน"
            fullWidth
            {...register('phoneNumber')}
            error={errors.phoneNumber?.message}
          />
          <Input
            label="รหัสผ่าน"
            type="password"
            placeholder="รหัสผ่านสำหรับบัญชี LINE"
            fullWidth
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Proxy (ถ้ามี)"
            placeholder="http://user:pass@host:port"
            fullWidth
            {...register('proxy')}
            error={errors.proxy?.message}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" isLoading={isLoading}>
              สร้างบัญชี
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal สำหรับกรอก OTP */}
      <Modal
        open={isOtpModalOpen}
        onClose={() => !isLoading && setIsOtpModalOpen(false)}
        title="กรอกรหัส OTP"
      >
        <div className="space-y-4">
          {/* แสดงสถานะปัจจุบัน */}
          <div className="text-sm bg-gray-50 p-3 rounded-md mb-3">
            <p className="font-medium mb-1">สถานะปัจจุบัน: <span className="text-blue-600">{status || 'รอการตอบกลับ'}</span></p>
            <p className="text-gray-600">{statusMessage || 'โปรดกรอกรหัส OTP ที่ได้รับทาง SMS'}</p>
          </div>
          <Input
            label="รหัส OTP"
            placeholder="กรอกรหัส OTP 6 หลัก"
            fullWidth
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOtpModalOpen(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleOtpSubmit} isLoading={isLoading}>
              ยืนยัน
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default RegisterPage; 