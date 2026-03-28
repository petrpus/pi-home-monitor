import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayPickerProps } from 'react-day-picker'
import { cs } from 'react-day-picker/locale'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export type CalendarProps = DayPickerProps

/**
 * Kalendář ve stylu shadcn: Tailwind + stejné button varianty jako zbytek UI.
 * Popover obal je Radix (`Popover`); samotný mřížkový widget je react-day-picker (bez jeho výchozího CSS).
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  locale,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      {...props}
      showOutsideDays={showOutsideDays}
      locale={locale ?? cs}
      className={cn('w-fit rounded-md bg-popover p-3 text-popover-foreground', className)}
      classNames={{
        months: 'relative flex flex-col gap-4 md:flex-row',
        month: 'relative flex w-full flex-col gap-4',
        month_caption: 'relative mx-auto flex h-9 w-full items-center justify-center px-9',
        caption_label: 'text-sm font-medium text-foreground',
        nav: 'absolute inset-x-0 top-0 flex w-full items-center justify-between',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'w-8 flex-1 select-none text-center text-[0.75rem] font-normal text-muted-foreground',
        week: 'mt-2 flex w-full',
        day: 'flex h-8 w-8 items-center justify-center p-0 text-sm',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 p-0 font-normal text-foreground aria-selected:opacity-100',
        ),
        range_start: 'rounded-l-md bg-accent',
        range_middle: 'rounded-none bg-accent',
        range_end: 'rounded-r-md bg-accent',
        today: cn(
          'rounded-md bg-accent text-accent-foreground',
          'data-[selected=true]:rounded-none data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
        ),
        outside: 'text-muted-foreground/40 aria-selected:text-muted-foreground',
        disabled: 'text-muted-foreground opacity-40',
        hidden: 'invisible',
        selected:
          'rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        focused: 'relative z-10',
        ...classNames,
      }}
      components={{
        Chevron: ({ className: iconClass, orientation, ...rest }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className={cn('size-4', iconClass)} aria-hidden {...rest} />
        },
        ...components,
      }}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
