# Codebase Analysis — Main Source Code

> **Generated:** 2026-03-02 14:40:42  
> **Section:** `src/main`

---

### Overview

| Metric | Value |
|--------|------:|
| Total Files           | 164 |
| Total Directories     | 29 |
| Total Lines           | 21,971 |
| Code Lines            | 16,982 (77.3%) |
| Comment Lines         | 1,629 (7.4%) |
| Blank Lines           | 3,360 (15.3%) |
| Avg LOC / File        | 103.55 |
| Code-to-Comment Ratio | 10.42 |

### Language Breakdown

| Language | Files | Total Lines | Code Lines | Comment Lines | Blank Lines | % of Section |
|----------|------:|------------:|-----------:|--------------:|------------:|-------------:|
| Java | 159 | 20,845 | 16,248 | 1,387 | 3,210 | 94.9% |
| SQL | 2 | 937 | 605 | 208 | 124 | 4.3% |
| YAML | 1 | 154 | 96 | 34 | 24 | 0.7% |
| XML | 2 | 35 | 33 | 0 | 2 | 0.2% |

### Directory Breakdown

| Directory | Files | Total Lines | Code Lines | Comment Lines | Blank Lines | % |
|-----------|------:|------------:|-----------:|--------------:|------------:|--:|
| `java/com/busmate/routeschedule/service/impl` | 9 | 7,927 | 6,223 | 516 | 1,188 | 36.1% |
| `java/com/busmate/routeschedule/controller` | 10 | 4,067 | 3,338 | 195 | 534 | 18.5% |
| `java/com/busmate/routeschedule/repository` | 13 | 1,199 | 943 | 70 | 186 | 5.5% |
| `resources` | 4 | 1,115 | 723 | 242 | 150 | 5.1% |
| `java/com/busmate/routeschedule/passenger/service/impl` | 1 | 1,061 | 790 | 148 | 123 | 4.8% |
| `java/com/busmate/routeschedule/passenger/dto/response` | 6 | 1,055 | 756 | 85 | 214 | 4.8% |
| `java/com/busmate/routeschedule/dto/request` | 19 | 1,038 | 791 | 11 | 236 | 4.7% |
| `java/com/busmate/routeschedule/dto/response` | 18 | 731 | 579 | 29 | 123 | 3.3% |
| `java/com/busmate/routeschedule/entity` | 14 | 647 | 497 | 5 | 145 | 2.9% |
| `java/com/busmate/routeschedule/passenger/repository` | 1 | 381 | 272 | 69 | 40 | 1.7% |
| `java/com/busmate/routeschedule/service` | 9 | 359 | 287 | 24 | 48 | 1.6% |
| `java/com/busmate/routeschedule/dto/response/importing` | 6 | 336 | 266 | 2 | 68 | 1.5% |
| `java/com/busmate/routeschedule/config` | 6 | 315 | 251 | 23 | 41 | 1.4% |
| `java/com/busmate/routeschedule/passenger/controller` | 1 | 258 | 192 | 20 | 46 | 1.2% |
| `java/com/busmate/routeschedule/dto/response/statistic` | 6 | 205 | 173 | 9 | 23 | 0.9% |
| `java/com/busmate/routeschedule/security` | 3 | 203 | 167 | 3 | 33 | 0.9% |
| `java/com/busmate/routeschedule/passenger/dto/projection` | 2 | 154 | 96 | 36 | 22 | 0.7% |
| `java/com/busmate/routeschedule/dto/response/filter` | 4 | 152 | 115 | 11 | 26 | 0.7% |
| `java/com/busmate/routeschedule/enums` | 12 | 147 | 78 | 49 | 20 | 0.7% |
| `java/com/busmate/routeschedule/exception` | 6 | 139 | 115 | 0 | 24 | 0.6% |
| `java/com/busmate/routeschedule/dto/response/exporting` | 2 | 108 | 86 | 6 | 16 | 0.5% |
| `java/com/busmate/routeschedule/passenger/dto/request` | 2 | 103 | 75 | 9 | 19 | 0.5% |
| `java/com/busmate/routeschedule/passenger/service` | 1 | 76 | 14 | 57 | 5 | 0.3% |
| `java/com/busmate/routeschedule/dto/response/updating` | 1 | 73 | 60 | 3 | 10 | 0.3% |
| `java/com/busmate/routeschedule/util` | 3 | 39 | 29 | 4 | 6 | 0.2% |
| `java/com/busmate/routeschedule/advice` | 1 | 31 | 26 | 0 | 5 | 0.1% |
| `java/com/busmate/routeschedule/dto/common` | 2 | 28 | 20 | 3 | 5 | 0.1% |
| `java/com/busmate/routeschedule` | 1 | 13 | 9 | 0 | 4 | 0.1% |
| `.` | 1 | 11 | 11 | 0 | 0 | 0.1% |

### File Breakdown (Top 30 by Total Lines)

| File | Language | Total Lines | Code Lines | Comment Lines | Blank Lines |
|------|----------|------------:|-----------:|--------------:|------------:|
| `src/main/java/com/busmate/routeschedule/service/impl/RouteServiceImpl.java` | Java | 1,768 | 1,362 | 139 | 267 |
| `src/main/java/com/busmate/routeschedule/service/impl/StopServiceImpl.java` | Java | 1,543 | 1,200 | 94 | 249 |
| `src/main/java/com/busmate/routeschedule/service/impl/ScheduleServiceImpl.java` | Java | 1,474 | 1,143 | 122 | 209 |
| `src/main/java/com/busmate/routeschedule/service/impl/TripServiceImpl.java` | Java | 1,079 | 833 | 76 | 170 |
| `src/main/java/com/busmate/routeschedule/passenger/service/impl/PassengerQueryServiceImpl.java` | Java | 1,061 | 790 | 148 | 123 |
| `src/main/java/com/busmate/routeschedule/controller/ScheduleController.java` | Java | 802 | 691 | 15 | 96 |
| `src/main/java/com/busmate/routeschedule/controller/BusOperatorController.java` | Java | 739 | 541 | 82 | 116 |
| `src/main/java/com/busmate/routeschedule/service/impl/PassengerServicePermitServiceImpl.java` | Java | 609 | 487 | 38 | 84 |
| `src/main/java/com/busmate/routeschedule/controller/RouteController.java` | Java | 569 | 465 | 23 | 81 |
| `src/main/java/com/busmate/routeschedule/controller/StopController.java` | Java | 549 | 456 | 23 | 70 |
| `src/main/resources/schema.sql` | SQL | 542 | 384 | 86 | 72 |
| `src/main/java/com/busmate/routeschedule/passenger/dto/response/FindMyBusDetailsResponse.java` | Java | 528 | 360 | 57 | 111 |
| `src/main/java/com/busmate/routeschedule/service/impl/BusServiceImpl.java` | Java | 474 | 375 | 27 | 72 |
| `src/main/java/com/busmate/routeschedule/repository/TripRepository.java` | Java | 471 | 361 | 40 | 70 |
| `src/main/java/com/busmate/routeschedule/service/impl/RouteGroupServiceImpl.java` | Java | 431 | 370 | 2 | 59 |
| `src/main/resources/data.sql` | SQL | 395 | 221 | 122 | 52 |
| `src/main/java/com/busmate/routeschedule/passenger/repository/PassengerQueryRepository.java` | Java | 381 | 272 | 69 | 40 |
| `src/main/java/com/busmate/routeschedule/controller/TripController.java` | Java | 371 | 306 | 11 | 54 |
| `src/main/java/com/busmate/routeschedule/service/impl/OperatorServiceImpl.java` | Java | 348 | 279 | 15 | 54 |
| `src/main/java/com/busmate/routeschedule/controller/BusController.java` | Java | 318 | 264 | 18 | 36 |
| `src/main/java/com/busmate/routeschedule/controller/OperatorController.java` | Java | 305 | 256 | 16 | 33 |
| `src/main/java/com/busmate/routeschedule/passenger/dto/response/FindMyBusResponse.java` | Java | 261 | 164 | 23 | 74 |
| `src/main/java/com/busmate/routeschedule/passenger/controller/PassengerQueryController.java` | Java | 258 | 192 | 20 | 46 |
| `src/main/java/com/busmate/routeschedule/service/impl/BusPassengerServicePermitAssignmentServiceImpl.java` | Java | 201 | 174 | 3 | 24 |
| `src/main/java/com/busmate/routeschedule/dto/request/ScheduleRequest.java` | Java | 190 | 165 | 0 | 25 |
| `src/main/java/com/busmate/routeschedule/controller/HealthController.java` | Java | 186 | 161 | 2 | 23 |
| `src/main/java/com/busmate/routeschedule/repository/RouteRepository.java` | Java | 186 | 161 | 1 | 24 |
| `src/main/java/com/busmate/routeschedule/dto/response/importing/ScheduleCsvImportResponse.java` | Java | 179 | 132 | 0 | 47 |
| `src/main/java/com/busmate/routeschedule/controller/PassengerServicePermitController.java` | Java | 174 | 151 | 5 | 18 |
| `src/main/java/com/busmate/routeschedule/dto/response/ScheduleResponse.java` | Java | 163 | 116 | 0 | 47 |

---

*Report generated by BusMate Codebase Analysis Tool*