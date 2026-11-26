import { useState } from 'react';

import { Calendar } from '@smartapp/ui/components/calendar';
import { Card, CardContent } from '@smartapp/ui/components/card';

export function Pattern() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="p-0">
      <CardContent className="p-0">
        <Calendar
          classNames={{
            day_button: '!rounded-full',
          }}
          mode="single"
          onSelect={setDate}
          selected={date}
        />
      </CardContent>
    </Card>
  );
}
