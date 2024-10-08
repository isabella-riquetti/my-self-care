/* eslint-disable react-hooks/exhaustive-deps */
import { Action, FrequencyType, MontlyFrequency, OnWeekDay, UserActionFrequency } from '@careminder/shared/types';
import { Button, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import cn from 'classnames';
import { addDays, addMinutes, endOfDay, endOfMonth, format, getWeekOfMonth, isBefore, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
import { filter, get, isEqual, remove, set as setObj, uniqBy } from "lodash";
import pluralize from "pluralize";
import { InputNumber, InputNumberValueChangeEvent } from "primereact/inputnumber";
import React, { useCallback, useEffect, useMemo } from 'react';

import FocusDatePicker from '@/components/atoms/FocusDatePicker';
import HabitSwitch from '@/components/atoms/HabitSwitch';
import { calcMaxEndDate } from '@/utils/date';
import { numberToOrdinal } from '@/utils/number';

interface FrequencySelectorProps {
    action?: Action;
    isHabit: boolean;
    setIsHabit: React.Dispatch<React.SetStateAction<boolean>>;
    startDate: Date;
    frequency?: UserActionFrequency;
    setFrequency: React.Dispatch<React.SetStateAction<UserActionFrequency | undefined>>;
    isAllDay: boolean;
}

export default function FrequencySelector({ action, frequency, setFrequency, isHabit, setIsHabit, startDate, isAllDay }: FrequencySelectorProps) {
    const defaultFrequency: UserActionFrequency = useMemo(() => ({
        frequency: 1,
        frequency_type: FrequencyType.DAY,
        end_date: calcMaxEndDate(FrequencyType.DAY, startDate)
    }), []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFrequencyChange = useCallback((path: string, value: any) => {
        setFrequency((prev?: UserActionFrequency) => {
            const newItem = { ...(prev ?? defaultFrequency) };
            setObj(newItem ?? {}, path, value);
            return newItem;
        });
    }, [defaultFrequency, setFrequency]);

    const hasOnWeeklyFrequency = (value: OnWeekDay) => {
        const curr: OnWeekDay[] = get(frequency, 'on_week', []);
        return curr?.includes(value);
    }

    const hasOnDailyFrequency = (value: Date) => {
        const curr: Date[] = get(frequency, 'on_day', []);
        return curr?.some(v => isEqual(v, value));
    }

    const toggleOnFrequency = (path: string, value: OnWeekDay | Date) => {
        const curr: (OnWeekDay | Date)[] = get(frequency, path);
        if (curr.some(c => c.toString() === value.toString())) {
            handleFrequencyChange(path, remove(curr, c => c.toString() !== value.toString()))
        } else {
            handleFrequencyChange(path, [...curr ?? [], value]);
        }
    }

    const getMonthlyFrequencyOptions = useMemo(() => {
        const weekDay = startDate.getDay();
        const weekDayName = format(startDate, "eeee");
        const firstDayMonth = startOfMonth(startDate);
        const lastDayMonth = endOfMonth(startDate);
        const lastWeekStart = addDays(lastDayMonth, -7);
        const currentWeek = getWeekOfMonth(startDate);
        const weekIndex = firstDayMonth.getDay() > startDate.getDay() ? currentWeek - 1 : currentWeek;
        const options: MontlyFrequency[] = [];
        options.push({ title: `Monthly on ${format(startDate, 'do')} day`, day: startDate.getDate() });
        if (isSameDay(lastDayMonth, startDate)) options.push({ title: "Last day of the month", day: 31 });
        if (getWeekOfMonth(lastDayMonth) < 6) options.push({ title: `Monthly on ${numberToOrdinal(weekIndex)} ${weekDayName}`, weekNumber: weekIndex, weekDay: weekDay });
        if (startDate > lastWeekStart) options.push({ title: `Monthly on last ${weekDayName}`, weekNumber: 6, weekDay: weekDay });

        return options;
    }, [startDate]);

    useEffect(() => {
        if (frequency?.frequency_type === FrequencyType.MONTH && !getMonthlyFrequencyOptions.some(g => isEqual(g, frequency?.on_month))) {
            handleFrequencyChange('on_month', getMonthlyFrequencyOptions[frequency?.on_month?.day ? 0 : 1])
        }
    }, [frequency?.frequency_type, frequency?.on_month, getMonthlyFrequencyOptions, handleFrequencyChange]);

    const getDefaultFrequencyValue = (frequencyType: FrequencyType) => {
        const on_day = frequencyType === FrequencyType.DAY
            ? [startDate]
            : undefined;
        const on_week = frequencyType === FrequencyType.WEEK
            ? [startDate.getDay()]
            : undefined;
        const on_month = frequencyType === FrequencyType.MONTH
            ? getMonthlyFrequencyOptions[0]
            : undefined;

        return { on_day, on_week, on_month };
    }

    const handleFrequencyTypeChange = (frequencyType: FrequencyType) => {
        setFrequency((prev?: UserActionFrequency) => ({
            ...(prev ?? defaultFrequency),
            frequency_type: frequencyType,
            end_date: calcMaxEndDate(frequencyType, startDate),
            ...getDefaultFrequencyValue(frequencyType),
        }))
    }

    const timeIntervals = useMemo(() => {
        const dates: Date[] = [];
        if (frequency?.frequency_type === FrequencyType.DAY) {
            const end = endOfDay(startDate);
            let current = startDate;
            while (isBefore(current, end) || current.getTime() === end.getTime()) {
                dates.push(current);
                current = addMinutes(current, 60);
            }
        }

        return dates;
    }, [frequency?.frequency_type, startDate]);

    useEffect(() => {
        if (frequency?.frequency_type === FrequencyType.DAY) {
            const newOnDay = uniqBy([startDate, ...filter(frequency.on_day, (onDay) =>
                timeIntervals.some(timeInterval => isEqual(onDay, timeInterval))
            )], (v) => v.toString());
            if (!isEqual(newOnDay, frequency.on_day)) handleFrequencyChange('on_day', newOnDay)
        }
    }, [startDate]);

    const handleToggleIsHabit = (isHabit: boolean) => {
        if (isHabit) {
            if (!frequency) {
                setFrequency({
                    frequency: 1,
                    frequency_type: FrequencyType.WEEK,
                    on_week: [startDate.getDay()],
                    end_date: calcMaxEndDate(FrequencyType.WEEK, startDate),
                });
            } else if (action?.suggested_frequency) {
                setFrequency({
                    ...action.suggested_frequency,
                    end_date: calcMaxEndDate(action.suggested_frequency.frequency_type, startDate),
                    ...getDefaultFrequencyValue(action.suggested_frequency.frequency_type),
                });
            }
        }
        setIsHabit(isHabit);
    }

    useEffect(() => {
        if (action?.suggested_frequency && !isHabit && !frequency) {
            setIsHabit(true);
            setFrequency({
                ...action.suggested_frequency,
                end_date: calcMaxEndDate(action.suggested_frequency.frequency_type, startDate),
                ...getDefaultFrequencyValue(action.suggested_frequency.frequency_type),
            });
        }
    }, [action, isHabit, frequency, startDate]);

    return (
        <div className="flex gap-3 ">
            <HabitSwitch
                isHabit={isHabit}
                setIsHabit={handleToggleIsHabit} />
            {isHabit && frequency && <div className='grid grid-cols-[auto,auto] gap-4'>
                <span className=" text-pale-400">Every: </span>
                <div className='flex gap-4'>
                    <InputNumber
                        value={frequency?.frequency}
                        onValueChange={(e: InputNumberValueChangeEvent) => handleFrequencyChange('frequency', Number(e.value))}
                        mode="decimal"
                        showButtons
                        min={1}
                        max={999}
                    />
                    <Select
                        value={frequency?.frequency_type}
                        onChange={(event: SelectChangeEvent<FrequencyType>) => handleFrequencyTypeChange(event.target.value as FrequencyType)}
                    >
                        <MenuItem value={FrequencyType.DAY}>{pluralize("Day", frequency?.frequency)}</MenuItem>
                        <MenuItem value={FrequencyType.WEEK}>{pluralize("Week", frequency?.frequency)}</MenuItem>
                        <MenuItem value={FrequencyType.MONTH}>{pluralize("Month", frequency?.frequency)}</MenuItem>
                        <MenuItem value={FrequencyType.YEAR}>{pluralize("Year", frequency?.frequency)}</MenuItem>
                    </Select>
                </div>

                {frequency?.frequency_type === FrequencyType.DAY && !isAllDay &&
                    <>
                        <span className="text-pale-400 self-start">At: </span>
                        <div className="flex gap-2 cursor-pointer flex-wrap">
                            {timeIntervals.map((t) => (
                                <Button
                                    disabled={t === startDate}
                                    className="cursor-default disabled:bg-pink-400 disabled:text-white w-[80px]"
                                    key={t.toString()}
                                    variant={hasOnDailyFrequency(t) ? 'contained' : 'outlined'}
                                    onClick={() => toggleOnFrequency('on_day', t)}
                                >
                                    {format(t, 'hh:mm a')}
                                </Button>
                            ))}
                        </div>
                    </>
                }

                {(frequency?.frequency_type === FrequencyType.WEEK) &&
                    <>
                        <span className="text-pale-400">On: </span>
                        <div className="flex gap-2 cursor-pointer">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <Button
                                    sx={{
                                        '&:hover': {
                                            background: 'primary.main'
                                        },
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        borderColor: 'primary.main',
                                        minWidth: "0px",
                                        padding: '0px',
                                    }}
                                    key={i.toString()}
                                    className={cn('rounded-full border border-pale-400 min-w-0 w-6 h-6 justify-center items-center flex', {
                                        'bg-pink-500 text-white': hasOnWeeklyFrequency(i as OnWeekDay)
                                    })}
                                    onClick={() => toggleOnFrequency('on_week', i as OnWeekDay)} >
                                    <span>{format(addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), Number(i)), 'EEEEE')}</span>
                                </Button>
                            ))}
                        </div>
                    </>}


                {(frequency?.frequency_type === FrequencyType.MONTH && !!getMonthlyFrequencyOptions?.length) &&
                    <>
                        <span className="text-pale-400 self-start">On: </span>
                        <div className="flex gap-2 cursor-pointer flex-wrap">
                            <Select
                                autoWidth={true}
                                value={frequency?.on_month?.title}
                                onChange={(event: SelectChangeEvent<string>) => handleFrequencyChange('on_month', getMonthlyFrequencyOptions.find(e => e.title === event.target.value))}
                            >
                                {getMonthlyFrequencyOptions.map(o => (
                                    <MenuItem key={o.title} value={o.title}>
                                        <span className='px-2'>{o.title}</span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </div>
                    </>
                }
                <span className="text-pale-400 self-start">Until: </span>
                <FocusDatePicker
                    value={frequency.end_date}
                    setValue={(val: Date) => handleFrequencyChange('end_date', val)}
                />
            </div>}
        </div>
    )
}
