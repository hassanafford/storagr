import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, TrendingDown, TrendingUp, Repeat } from 'lucide-react';
import { useNotification } from './NotificationProvider';
import { getItemsByWarehouseService } from '../services/itemService';
import { createTransactionService } from '../services/itemService';

const TransactionForms = ({ user, warehouse, onTransactionComplete }) => {
  const { addNotification } = useNotification();
  const [activeForm, setActiveForm] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [issueForm, setIssueForm] = useState({
    item_id: '',
    quantity: '',
    recipient: '',
    notes: ''
  });

  const [returnForm, setReturnForm] = useState({
    item_id: '',
    quantity: '',
    notes: ''
  });

  const [exchangeForm, setExchangeForm] = useState({
    old_item_id: '',
    new_item_id: '',
    quantity: '',
    notes: ''
  });

  // Load items when a form is opened
  const loadItems = async () => {
    if (items.length > 0) return; // Already loaded
    
    try {
      setLoadingItems(true);
      const data = await getItemsByWarehouseService(warehouse.id);
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
      addNotification({
        message: 'حدث خطأ أثناء تحميل بيانات العناصر',
        type: 'error'
      });
    } finally {
      setLoadingItems(false);
    }
  };

  // Handle form opening
  const openForm = (formType) => {
    setActiveForm(formType);
    loadItems();
  };

  // Handle form closing
  const closeForm = () => {
    setActiveForm(null);
    // Reset forms
    setIssueForm({ item_id: '', quantity: '', recipient: '', notes: '' });
    setReturnForm({ item_id: '', quantity: '', notes: '' });
    setExchangeForm({ old_item_id: '', new_item_id: '', quantity: '', notes: '' });
  };

  // Handle issue form submission
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    
    if (!issueForm.item_id || !issueForm.quantity || !issueForm.recipient) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }

    if (issueForm.quantity <= 0) {
      addNotification({
        message: 'الكمية يجب أن تكون أكبر من صفر',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const transactionData = {
        item_id: issueForm.item_id,
        user_id: user.id,
        transaction_type: 'issue',
        quantity: -Math.abs(issueForm.quantity), // Negative for issue
        recipient: issueForm.recipient,
        notes: issueForm.notes
      };

      await createTransactionService(transactionData);
      
      addNotification({
        message: 'تم صرف العنصر بنجاح',
        type: 'success'
      });
      
      // Reset form
      setIssueForm({ item_id: '', quantity: '', recipient: '', notes: '' });
      closeForm();
      
      // Notify parent component to refresh data
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Error submitting issue transaction:', error);
      addNotification({
        message: 'حدث خطأ أثناء صرف العنصر',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle return form submission
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    
    if (!returnForm.item_id || !returnForm.quantity) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }

    if (returnForm.quantity <= 0) {
      addNotification({
        message: 'الكمية يجب أن تكون أكبر من صفر',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const transactionData = {
        item_id: returnForm.item_id,
        user_id: user.id,
        transaction_type: 'return',
        quantity: Math.abs(returnForm.quantity), // Positive for return
        notes: returnForm.notes
      };

      await createTransactionService(transactionData);
      
      addNotification({
        message: 'تم إرجاع العنصر بنجاح',
        type: 'success'
      });
      
      // Reset form
      setReturnForm({ item_id: '', quantity: '', notes: '' });
      closeForm();
      
      // Notify parent component to refresh data
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Error submitting return transaction:', error);
      addNotification({
        message: 'حدث خطأ أثناء إرجاع العنصر',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle exchange form submission
  const handleExchangeSubmit = async (e) => {
    e.preventDefault();
    
    if (!exchangeForm.old_item_id || !exchangeForm.new_item_id || !exchangeForm.quantity) {
      addNotification({
        message: 'يرجى ملء جميع الحقول المطلوبة',
        type: 'error'
      });
      return;
    }

    if (exchangeForm.quantity <= 0) {
      addNotification({
        message: 'الكمية يجب أن تكون أكبر من صفر',
        type: 'error'
      });
      return;
    }

    if (exchangeForm.old_item_id === exchangeForm.new_item_id) {
      addNotification({
        message: 'لا يمكن استبدال العنصر بنفس العنصر',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create exchange out transaction (negative quantity)
      const exchangeOutData = {
        item_id: exchangeForm.old_item_id,
        user_id: user.id,
        transaction_type: 'exchange_out',
        quantity: -Math.abs(exchangeForm.quantity),
        notes: exchangeForm.notes ? `استبدال: ${exchangeForm.notes}` : 'استبدال عنصر'
      };

      await createTransactionService(exchangeOutData);

      // Create exchange in transaction (positive quantity)
      const exchangeInData = {
        item_id: exchangeForm.new_item_id,
        user_id: user.id,
        transaction_type: 'exchange_in',
        quantity: Math.abs(exchangeForm.quantity),
        notes: exchangeForm.notes ? `استبدال: ${exchangeForm.notes}` : 'استبدال عنصر'
      };

      await createTransactionService(exchangeInData);
      
      addNotification({
        message: 'تم استبدال العنصر بنجاح',
        type: 'success'
      });
      
      // Reset form
      setExchangeForm({ old_item_id: '', new_item_id: '', quantity: '', notes: '' });
      closeForm();
      
      // Notify parent component to refresh data
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Error submitting exchange transaction:', error);
      addNotification({
        message: 'حدث خطأ أثناء استبدال العنصر',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render issue form
  const renderIssueForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          صرف عهدة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue-item">العنصر</Label>
            <Select 
              value={issueForm.item_id} 
              onValueChange={(value) => setIssueForm({...issueForm, item_id: value})}
              disabled={loadingItems}
            >
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
            <Label htmlFor="issue-quantity">الكمية</Label>
            <Input
              id="issue-quantity"
              type="number"
              min="1"
              value={issueForm.quantity}
              onChange={(e) => setIssueForm({...issueForm, quantity: parseInt(e.target.value) || ''})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="issue-recipient">اسم المستلم</Label>
            <Input
              id="issue-recipient"
              value={issueForm.recipient}
              onChange={(e) => setIssueForm({...issueForm, recipient: e.target.value})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="issue-notes">السبب (اختياري)</Label>
            <Textarea
              id="issue-notes"
              value={issueForm.notes}
              onChange={(e) => setIssueForm({...issueForm, notes: e.target.value})}
              placeholder="سبب الصرف"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'جاري الصرف...' : 'صرف العهدة'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  // Render return form
  const renderReturnForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          إرجاع عهدة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="return-item">العنصر</Label>
            <Select 
              value={returnForm.item_id} 
              onValueChange={(value) => setReturnForm({...returnForm, item_id: value})}
              disabled={loadingItems}
            >
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
            <Label htmlFor="return-quantity">الكمية</Label>
            <Input
              id="return-quantity"
              type="number"
              min="1"
              value={returnForm.quantity}
              onChange={(e) => setReturnForm({...returnForm, quantity: parseInt(e.target.value) || ''})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="return-notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="return-notes"
              value={returnForm.notes}
              onChange={(e) => setReturnForm({...returnForm, notes: e.target.value})}
              placeholder="ملاحظات حول الإرجاع"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'جاري الإرجاع...' : 'إرجاع العهدة'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  // Render exchange form
  const renderExchangeForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          استبدال عهدة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleExchangeSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exchange-old-item">العنصر المراد استبداله</Label>
            <Select 
              value={exchangeForm.old_item_id} 
              onValueChange={(value) => setExchangeForm({...exchangeForm, old_item_id: value})}
              disabled={loadingItems}
            >
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
            <Label htmlFor="exchange-new-item">العنصر الجديد</Label>
            <Select 
              value={exchangeForm.new_item_id} 
              onValueChange={(value) => setExchangeForm({...exchangeForm, new_item_id: value})}
              disabled={loadingItems}
            >
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
            <Label htmlFor="exchange-quantity">الكمية</Label>
            <Input
              id="exchange-quantity"
              type="number"
              min="1"
              value={exchangeForm.quantity}
              onChange={(e) => setExchangeForm({...exchangeForm, quantity: parseInt(e.target.value) || ''})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exchange-notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="exchange-notes"
              value={exchangeForm.notes}
              onChange={(e) => setExchangeForm({...exchangeForm, notes: e.target.value})}
              placeholder="ملاحظات حول الاستبدال"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'جاري الاستبدال...' : 'استبدال العهدة'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  // Render main buttons when no form is active
  const renderMainButtons = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Button 
        onClick={() => openForm('issue')}
        className="h-24 flex flex-col items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white"
      >
        <TrendingDown className="h-8 w-8" />
        <span className="text-lg font-medium">صرف عهدة</span>
      </Button>
      
      <Button 
        onClick={() => openForm('return')}
        className="h-24 flex flex-col items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white"
      >
        <TrendingUp className="h-8 w-8" />
        <span className="text-lg font-medium">إرجاع عهدة</span>
      </Button>
      
      <Button 
        onClick={() => openForm('exchange')}
        className="h-24 flex flex-col items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white"
      >
        <Repeat className="h-8 w-8" />
        <span className="text-lg font-medium">استبدال عهدة</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            عمليات الحركة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeForm === 'issue' && renderIssueForm()}
          {activeForm === 'return' && renderReturnForm()}
          {activeForm === 'exchange' && renderExchangeForm()}
          
          {!activeForm && (
            <>
              {renderMainButtons()}
              
              <Alert className="mt-6">
                <AlertDescription>
                  <ul className="list-disc pr-5 space-y-1 text-sm">
                    <li>اختر نوع العملية التي ترغب في تنفيذها</li>
                    <li>املأ النموذج بعناية مع تحديد العنصر والكمية</li>
                    <li>جميع العمليات تسجل تلقائياً في قاعدة البيانات</li>
                    <li>سيتم إرسال إشعار فوري إلى الإدارة عند أي عملية</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionForms;