import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { addressService, Address, NewAddressData } from '@/services/addressService';

const ManageAddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const initialNewAddressState: NewAddressData = {
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    state: '',
    isDefault: false,
  };
  const [newAddress, setNewAddress] = useState<NewAddressData>(initialNewAddressState);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const fetched = await addressService.getAddresses();
        setAddresses(fetched || []);
      } catch (error) {
        toast.error('Failed to fetch addresses.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddresses();
  }, []);

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleDefaultChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      setNewAddress(prev => ({ ...prev, isDefault: checked }));
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.addressLine1.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.pincode.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsAdding(true);
    try {
      const updated = await addressService.addAddress({
        ...newAddress,
        addressLine1: newAddress.addressLine1.trim(),
        addressLine2: newAddress.addressLine2?.trim(),
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        pincode: newAddress.pincode.trim(),
      });
      setAddresses(updated);
      toast.success('Address added successfully.');
      setNewAddress(initialNewAddressState);
      setShowAddForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.errors?.[0]?.msg || 'Failed to add address.');
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const updated = await addressService.deleteAddress(id);
      setAddresses(updated);
      toast.success('Address deleted.');
    } catch (error) {
      toast.error('Failed to delete address.');
      console.error(error);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto mt-6 shadow-lg border border-border/10">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Manage Addresses</CardTitle>
          <CardDescription>Add or remove your saved delivery addresses.</CardDescription>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? 'outline' : 'default'}>
          {showAddForm ? <X className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'Add New Address'}
        </Button>
      </CardHeader>

      <CardContent>
        {showAddForm && (
          <form onSubmit={handleAddAddress} className="mb-6 p-4 border rounded-md space-y-4 bg-muted/50">
            <h3 className="text-lg font-semibold">Add New Address</h3>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1*</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                value={newAddress.addressLine1}
                onChange={handleNewAddressChange}
                required
                placeholder="Street address, P.O. box, company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                value={newAddress.addressLine2 || ''}
                onChange={handleNewAddressChange}
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City*</Label>
                <Input id="city" name="city" value={newAddress.city} onChange={handleNewAddressChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State*</Label>
                <Input id="state" name="state" value={newAddress.state} onChange={handleNewAddressChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode*</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={newAddress.pincode}
                  onChange={handleNewAddressChange}
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  title="Enter a 6-digit Indian pincode"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="isDefault" name="isDefault" checked={newAddress.isDefault} onCheckedChange={handleDefaultChange} />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default delivery address
              </Label>
            </div>

            <Button type="submit" disabled={isAdding || !newAddress.addressLine1.trim()} className="w-full sm:w-auto">
              {isAdding ? 'Adding Address...' : 'Save Address'}
            </Button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading addresses...</div>
        ) : addresses.length === 0 && !showAddForm ? (
          <p className="text-muted-foreground text-center py-4">
            You haven't saved any addresses yet. Click 'Add New Address' to start.
          </p>
        ) : (
          <div className="space-y-4">
            {addresses.map(addr => (
              <div
                key={addr._id}
                className="border p-4 rounded-md flex justify-between items-start gap-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-grow space-y-1">
                  <p className="font-medium">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-sm text-muted-foreground">{addr.addressLine2}</p>}
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  {addr.isDefault && (
                    <span className="text-xs font-semibold text-green-600 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/50">
                      Default Address
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(addr._id)} aria-label="Delete address">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageAddressesPage;