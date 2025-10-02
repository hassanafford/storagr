import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Calendar, Package } from 'lucide-react';
import { useNotification } from './NotificationProvider';
import { getItemsByWarehouse } from '../services/itemService';
import { createDailyAudit } from '../services/auditService';

const DailyAudit = ({ user, warehouse }) => {
  const { addNotification } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [expectedQuantity, setExpectedQuantity] = useState(0);
  const [actualQuantity, setActualQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [auditHistory, setAuditHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load items for the warehouse
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await getItemsByWarehouse(warehouse.id);
        setItems(data);
        setLoading(false);
      } catch (error) {
        console.error('Error loading items:', error);
        addNotification({
          message: 'حدث خطأ أثناء تحميل بيانات العناصر',
          type: 'error'
        });
        setLoading(false);
      }
    };

    if (warehouse) {
      loadItems();
    }
  }, [warehouse]);

  // Handle item selection
  const handleItemSelect = (itemId) => {
    setSelectedItem(itemId);
    const item = items.find(i => i.id == itemId);
    if (item) {
      setExpectedQuantity(item.quantity);
      setActualQuantity(item.quantity);
    }
  };

  // Handle audit submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedItem) {
      addNotification({
        message: 'يرجى اختيار عنصر للجرد',
        type: 'error'
      });
      return;
    }

    if (actualQuantity < 0) {
      addNotification({
        message: 'الكمية الفعلية لا يمكن أن تكون سالبة',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const auditData = {
        warehouse_id: warehouse.id,
        item_id: selectedItem,
        user_id: user.id,
        expected_quantity: expectedQuantity,
        actual_quantity: actualQuantity,
        notes: notes
      };

      await createDailyAudit(auditData);
      
      addNotification({
        message: 'تم تسجيل الجرد اليومي بنجاح',
        type: 'success'
      });
      
      // Reset form
      setSelectedItem('');
      setExpectedQuantity(0);
      setActualQuantity(0);
      setNotes('');
      
      // Refresh items
      const data = await getItemsByWarehouse(warehouse.id);
      setItems(data);
    } catch (error) {
      console.error('Error submitting audit:', error);
      addNotification({
        message: 'حدث خطأ أثناء تسجيل الجرد اليومي',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate discrepancy
  const discrepancy = actualQuantity - expectedQuantity;

  // Get discrepancy status
  const getDiscrepancyStatus = () => {
    if (discrepancy === 0) return 'perfect';
    if (Math.abs(discrepancy) <= 2) return 'acceptable';
    return 'concerning';
  };

  const discrepancyStatus = getDiscrepancyStatus();

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            جرد يومي للمخزن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="item">العنصر</Label>
                <Select value={selectedItem} onValueChange={handleItemSelect} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر عنصر" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} (المتوفر: {item.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expected">الكمية المتوقعة</Label>
                <Input
                  id="expected"
                  type="number"
                  value={expectedQuantity}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="actual">الكمية الفعلية</Label>
                <Input
                  id="actual"
                  type="number"
                  min="0"
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>الاختلاف</Label>
                <div className={`p-3 rounded-lg ${
                  discrepancyStatus === 'perfect' ? 'bg-green-100 text-green-800' :
                  discrepancyStatus === 'acceptable' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {discrepancyStatus === 'perfect' && <CheckCircle className="h-5 w-5" />}
                    {discrepancyStatus === 'acceptable' && <AlertCircle className="h-5 w-5" />}
                    {discrepancyStatus === 'concerning' && <AlertCircle className="h-5 w-5" />}
                    <span className="font-medium">
                      {discrepancy > 0 ? '+' : ''}{discrepancy} عنصر
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    {discrepancyStatus === 'perfect' && 'الجرد مطابق تماماً'}
                    {discrepancyStatus === 'acceptable' && 'اختلاف مقبول'}
                    {discrepancyStatus === 'concerning' && 'اختلاف مقلق - يتطلب مراجعة'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية حول الجرد"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedItem}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'جاري التسجيل...' : 'تسجيل الجرد'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            تعليمات الجرد اليومي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <ul className="list-disc pr-5 space-y-2 text-sm">
                <li>قم بجرد جميع العناصر الموجودة في المخزن يومياً</li>
                <li>سجل الكمية الفعلية الموجودة في المخزن</li>
                <li>أدخل أي ملاحظات حول حالة العناصر أو أي اختلافات</li>
                <li>في حالة وجود اختلاف كبير، قم بإبلاغ الإدارة فوراً</li>
                <li>تأكد من دقة البيانات لمنع السرقات والخسائر</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyAudit;