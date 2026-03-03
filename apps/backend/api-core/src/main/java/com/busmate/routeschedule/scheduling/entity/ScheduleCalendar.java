package com.busmate.routeschedule.scheduling.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Data
@Entity
@Table(name = "schedule_calendar")
public class ScheduleCalendar {
    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(name = "monday", nullable = false)
    private Boolean monday = false;

    @Column(name = "tuesday", nullable = false)
    private Boolean tuesday = false;

    @Column(name = "wednesday", nullable = false)
    private Boolean wednesday = false;

    @Column(name = "thursday", nullable = false)
    private Boolean thursday = false;

    @Column(name = "friday", nullable = false)
    private Boolean friday = false;

    @Column(name = "saturday", nullable = false)
    private Boolean saturday = false;

    @Column(name = "sunday", nullable = false)
    private Boolean sunday = false;
}
