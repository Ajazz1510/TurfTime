import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { SelectContent } from "@/components/ui/select";
import { SelectItem } from "@/components/ui/select";
import { SelectTrigger } from "@/components/ui/select";
import { SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from '@/lib/api';
import type { Turf, Slot, Booking } from "@shared/schema"; // Import from original code


export default function BookingsPage() {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [turfsRes, slotsRes, bookingsRes] = await Promise.all([
          api.get('/turfs'),
          api.get('/slots'),
          api.get('/bookings/my-bookings')
        ]);
        setTurfs(turfsRes.data);
        setSlots(slotsRes.data);
        setMyBookings(bookingsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Handle error appropriately, e.g., display an error message
        setLoading(false); // Ensure loading state is updated even on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = format(new Date(slot.startTime), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  // Check if a slot is booked by the current user
  const isSlotBookedByMe = (slot: Slot) => {
    return myBookings.some(booking => booking.slotId === slot.id);
  };

  // Check if a slot is available (not booked by anyone)
  const isSlotAvailable = (slot: Slot) => {
    return !slot.isBooked;
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;

    try {
      await api.post('/bookings', {
        slotId: selectedSlot.id,
        turfId: selectedSlot.turfId,
      });

      // Refresh data
      const [slotsRes, bookingsRes] = await Promise.all([
        api.get('/slots'),
        api.get('/bookings/my-bookings')
      ]);
      setSlots(slotsRes.data);
      setMyBookings(bookingsRes.data);
      setIsDialogOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error booking slot:', error);
      // Handle error, e.g., display an error message to the user.
    }
  };

  const getTurfName = (turfId: string) => {
    const turf = turfs.find(t => t.id === turfId);
    return turf ? turf.name : 'Unknown Turf';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Book a Slot</h1>

      <div className="space-y-6">
        <div className="mb-4">
          <Label>Select Turf</Label>
          <Select value={selectedTurf || ''} onValueChange={setSelectedTurf}>
            <SelectTrigger>
              <SelectValue placeholder="Select a turf" />
            </SelectTrigger>
            <SelectContent>
              {turfs.map(turf => (
                <SelectItem key={turf.id} value={turf.id}>
                  {turf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6">
          {Object.entries(slotsByDate).map(([date, daySlots]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle>{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</CardTitle>
                <CardDescription>{daySlots.length} slots available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {daySlots
                    .filter(slot => !selectedTurf || slot.turfId === selectedTurf)
                    .map(slot => {
                      const isAvailable = isSlotAvailable(slot);
                      const isMyBooking = isSlotBookedByMe(slot);

                      return (
                        <Button
                          key={slot.id}
                          variant={
                            isMyBooking ? "default" :
                            isAvailable ? "outline" : "destructive"
                          }
                          className={`h-auto p-4 flex flex-col items-center justify-center ${
                            isAvailable ? 'hover:bg-green-100' :
                            isMyBooking ? 'bg-blue-100' : 'bg-red-100'
                          }`}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedSlot(slot);
                              setIsDialogOpen(true);
                            }
                          }}
                          disabled={!isAvailable && !isMyBooking}
                        >
                          <Clock className="h-5 w-5 mb-2" />
                          <span className="text-sm font-medium">
                            {format(new Date(slot.startTime), 'h:mm a')}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {getTurfName(slot.turfId)}
                          </span>
                          <Badge className="mt-2" variant={
                            isMyBooking ? "default" :
                            isAvailable ? "secondary" : "destructive"
                          }>
                            {isMyBooking ? "My Booking" :
                             isAvailable ? "Available" : "Booked"}
                          </Badge>
                        </Button>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Please confirm your booking details
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-4">
              <div>
                <Label>Turf</Label>
                <div className="mt-1">{getTurfName(selectedSlot.turfId)}</div>
              </div>

              <div>
                <Label>Date & Time</Label>
                <div className="mt-1">
                  {format(new Date(selectedSlot.startTime), 'MMMM d, yyyy h:mm a')} - {' '}
                  {format(new Date(selectedSlot.endTime), 'h:mm a')}
                </div>
              </div>

              <Button onClick={handleBookSlot} className="w-full">
                Confirm Booking
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}