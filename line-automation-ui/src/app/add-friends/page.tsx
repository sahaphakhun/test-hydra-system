'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Modal from '../components/ui/Modal';
import { addFriendsByPhoneNumbers } from '../services/api';
import { LineAccount, PhoneNumberList } from '../types';

// กำหนด Schema สำหรับการตรวจสอบข้อมูลฟอร์ม
const phoneListFormSchema = z.object({
  name: z.string().min(2, 'ชื่อรายการต้องมีอย่างน้อย 2 ตัวอักษร'),
  phoneNumbers: z.string().min(10, 'กรุณาระบุเบอร์โทรศัพท์อย่างน้อย 1 เบอร์'),
});

type PhoneListFormValues = z.infer<typeof phoneListFormSchema>;

const AddFriendsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedList, setSelectedList] = useState<PhoneNumberList | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<LineAccount | null>(null);
  const [phoneLists, setPhoneLists] = useState<PhoneNumberList[]>([]);
  const [accounts, setAccounts] = useState<LineAccount[]>([]);
  const [editMode, setEditMode] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PhoneListFormValues>({
    resolver: zodResolver(phoneListFormSchema),
  });

  const onSubmit = async (data: PhoneListFormValues) => {
    setIsLoading(true);
    try {
      // แปลงข้อความเป็นอาร์เรย์เบอร์โทรศัพท์
      const phoneArray = data.phoneNumbers
        .split('\n')
        .map((phone) => phone.trim())
        .filter((phone) => phone.length > 0);

      if (editMode && selectedList) {
        // ในกรณีแก้ไข ปรับปรุงรายการที่มีอยู่
        const updatedLists = phoneLists.map((list) =>
          list.id === selectedList.id
            ? {
                ...list,
                name: data.name,
                phoneNumbers: phoneArray,
              }
            : list
        );
        setPhoneLists(updatedLists);
      } else {
        // ในกรณีเพิ่มใหม่ สร้างรายการใหม่
        const newList: PhoneNumberList = {
          id: Date.now().toString(),
          name: data.name,
          phoneNumbers: phoneArray,
          createdAt: new Date().toISOString(),
        };
        setPhoneLists([...phoneLists, newList]);
      }

      setIsModalOpen(false);
      reset();
      setEditMode(false);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการจัดการรายการเบอร์โทรศัพท์:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (list: PhoneNumberList) => {
    setSelectedList(list);
    setValue('name', list.name);
    setValue('phoneNumbers', list.phoneNumbers.join('\n'));
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setPhoneLists(phoneLists.filter((list) => list.id !== id));
  };

  const handleUse = (list: PhoneNumberList) => {
    setSelectedList(list);
    setIsAccountModalOpen(true);
  };

  const handleAddFriends = async () => {
    if (!selectedList || !selectedAccount) return;
    
    setIsLoading(true);
    try {
      await addFriendsByPhoneNumbers(selectedAccount.id, selectedList.phoneNumbers);
      setIsAccountModalOpen(false);
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการเพิ่มเพื่อน:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title="แอดเพื่อน"
      subtitle="จัดการชุดเบอร์โทรศัพท์สำหรับเพิ่มเป็นเพื่อนในไลน์"
    >
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setEditMode(false);
            reset();
            setIsModalOpen(true);
          }}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          เพิ่มชุดเบอร์
        </Button>
      </div>

      {/* แสดงรายการชุดเบอร์โทรศัพท์ */}
      {phoneLists.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {phoneLists.map((list) => (
            <Card key={list.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{list.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(list)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(list.id)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-500 mt-2">จำนวน {list.phoneNumbers.length} เบอร์</p>
                <Button
                  onClick={() => handleUse(list)}
                  variant="outline"
                  className="mt-4 flex items-center justify-center"
                >
                  <UserPlusIcon className="h-5 w-5 mr-1" />
                  ใช้งาน
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">ยังไม่มีชุดเบอร์โทรศัพท์</p>
          <Button
            onClick={() => {
              setEditMode(false);
              reset();
              setIsModalOpen(true);
            }}
            className="mt-4"
          >
            เพิ่มชุดเบอร์
          </Button>
        </div>
      )}

      {/* Modal สำหรับเพิ่ม/แก้ไขชุดเบอร์โทรศัพท์ */}
      <Modal
        open={isModalOpen}
        onClose={() => !isLoading && setIsModalOpen(false)}
        title={editMode ? 'แก้ไขชุดเบอร์โทรศัพท์' : 'เพิ่มชุดเบอร์โทรศัพท์ใหม่'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="ชื่อชุดเบอร์โทรศัพท์"
            placeholder="ชื่อสำหรับอ้างอิงชุดเบอร์โทรศัพท์"
            fullWidth
            {...register('name')}
            error={errors.name?.message}
          />
          <Textarea
            label="รายการเบอร์โทรศัพท์"
            placeholder="กรอกเบอร์โทรศัพท์แต่ละบรรทัด เช่น 0891234567"
            rows={8}
            fullWidth
            {...register('phoneNumbers')}
            error={errors.phoneNumbers?.message}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditMode(false);
                reset();
              }}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {editMode ? 'บันทึกการแก้ไข' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal สำหรับเลือกบัญชี LINE */}
      <Modal
        open={isAccountModalOpen}
        onClose={() => !isLoading && setIsAccountModalOpen(false)}
        title="เลือกบัญชี LINE"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            เลือกบัญชี LINE ที่ต้องการใช้เพิ่มเพื่อน
          </p>
          
          {accounts.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedAccount?.id === account.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <div className="flex items-center">
                    <div className="flex-1">
                      <h4 className="font-medium">{account.displayName}</h4>
                      <p className="text-sm text-gray-500">{account.phoneNumber}</p>
                    </div>
                    {account.status === 'active' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        กำลังใช้งาน
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">ไม่มีบัญชี LINE</p>
              <Button
                onClick={() => {
                  setIsAccountModalOpen(false);
                  // นำทางไปยังหน้าสมัครสมาชิก
                  window.location.href = '/register';
                }}
                className="mt-4"
              >
                สมัครบัญชีใหม่
              </Button>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAccountModalOpen(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddFriends}
              disabled={!selectedAccount || isLoading}
              isLoading={isLoading}
            >
              เพิ่มเพื่อน
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default AddFriendsPage; 