// =============================================================================
// Mock Location Tracking — Route Definitions
// =============================================================================
// 2 routes with detailed waypoint geometry for realistic bus simulation.
// Easily extensible: add more RouteDefinition entries to this array.

import type { RouteDefinition, Waypoint } from './types';
import { decodePolyline, calculateDistance } from '../utils/geo';

const KANDY_POLYLINE = "_}gi@w{lfNg@hBZeEEEwAqAsA}CyAuCqBFgIjHuHzG}CeNaIqYuGma@wPaLcG{R{SCce@_Ao_Asq@ah@ib@qUwHqXkCuOcOeSeMeKAwPj@aSeE{M{J_QeGyQ{CuWg@aVhKqH~KcEnV_JdTkJbGgJtBqEhGka@xAVzCjCaEpBii@xJma@zTed@dXgf@vEyVh@eVuEia@yKyjAqE_mA@qTxD}NnS}NrY{F}AaDcHeGsFGkMoJs`@iHyJuJs\\eOoL{Qo[y^oh@op@qMoRcXaJ{IU_GwHmFcKoK_E_OqS{ZaWcM_R}D}EeHXgWqJa}@eXiMeKeSsUoRci@oZg]{ViVsUwI_PoLkVwNkd@{CmGeKuRwH_D}SuAiGkLmHwOoPaOsNq`@{s@kZsb@k_@mc@wJ{Ty@wRcE{X{JuV{IwHsLyB{_@mOe]i]gRga@gG_Ns@}HkLsj@gE{DeHPcMoCwPsJuKiHoFwGkl@qKaJeN_KiKuNeAqIgHwMyCcEgEyAiWrDgIjPwJpIeAhAsGmDqZoBsEoJ@gKoCeDkH}WgFoN_AoWuLeG_J{C__@yCsUh@mY}DcLuTgPsd@sb@s`@}WuU}UmOs[{Mwa@o[sVwX_[oVcLoPgAyDuId@_GtKaK~`@sQzDcD~Ew@`EwC{HaJ}HgOkOaKwMef@k@eOb_@kVr@sKGqGhGeKhG}KGqC{FgT_CkUuFkr@wFg[lCaL{NsLoAe_@z@uj@e@{TzDoSc@}g@gAcj@vGgl@lFyPkAuHPiEaF_E}HkFrHaIyCuTgGqCsU^gIg@mT}FqWf@aCUs@iElBqZ@}Mt@{LiHwh@gFuq@qGc`@tO}e@hGuJf@iToAki@_Lwp@oLo~@wGqc@ZwQbA_EyB}[`BkQlC{M~ByQ~E}PxVsI~LiB|AiCeGoBqF}E`BqA{BcBoDT{@uMcDkSr@oOg@wa@cGmd@_Ecb@nF{LzJoIfD_KlFi[UeTqBmLbEcI~GuCGwJ{@yLFaTEyEcEcGwEo[}EeYgCeGiD}AkDcEPoE_FsCZiBaEKaFeG~G_ZrGmIbB{GLaLgBoHmAuEhCgJf@gTe@mKbBiAzEbAqHmEwF}RoEmN_GcGqBqO_Iu`@{H_SqJuQdCsWkBeNlBaH\\}OyJyOa@uNeAkJgM_WjDiYxCaVqKsf@cFuKF{I?o^qDgK_AcPjEsCxJuKvBcNfDyG_Cw@g@mPcCkL~HkCKyIyU_MiAaGhD}OiDgMcQsLiA]J[dAwBqBgHgVkj@{X}`@yY{d@eRyXcDoEmLmHeGgB_AwBlGk@QV";
const GALLE_POLYLINE = "_}gi@w{lfNg@hBZeEEEwAqAsA}Ce@eCs@OqBFgIjHuHzG}CeNiCiIqCuDe@qIgC{[mCqDwPaLaFyIa@aH{SCcAMg@{@_@qAUwDoAgJDiFxC{JtEsHjNaSpFyTrAaJdDmDtBkBb@cRnB}_@pCw\\a@cMo@uG]eGjAqJDwLHof@{Cu|A~@kI[iFuCuMe@yEeCyW_@ePkAqx@hEqUtHeUb@sGu@iGn@w@fC@fFBnEK|KgAtIsChHkElPiRrJyM`LoKjKcGtDaAbFi@tLd@vSzF~V|FpW`Dpq@~Ezb@vGvPdBbTh@|RYrZoDn`@uCfg@PtYtAzUChQmAdg@_Dxe@eHxrAm[fLmBzPoAdJKx^~Avg@fD~x@pFvlBfTtUCbPmAl[cHbNwF~TaNpMoIddAkp@lUuIpL{BzSuAnV{@tdAyDziCuJt^aEtc@{Irp@_N`UiDbJe@tU\\|YvE~UpGdf@hL|QzA`IDda@oA`WpAhXzDvTbCvSJvw@uCdb@_BvG]~NeCnOkGhj@ee@hMaIrZqIdr@_P|_@kNbTkLfg@w[rt@kd@xj@cXxv@_[dWyI|QeDrbAiJ`k@_FhM}Ah\\qHzDwAbXmLrOsGfZyNlU{Qnr@ej@`QsHnZuE|[{DzKkCbN}Gn^{RrYgLzUsKdTsMnn@a_@hb@{VhZ_PlOgFvI}ArYsCnVq@tIu@rPsDnZaKzXaKrdAs[lw@mPjXiFvUyAhVdA|e@zCtYZhV_CxN}DnZcMv`Awa@`k@uThw@_Zd\\kQvX{Tvc@u_@bXgN`]cInXyAjP\\pOzA~_@pG`r@zMnb@fKfZnD~ZYzVkEfL}DxTkMfVwR|i@{^jVkQvUsOjKsDrL{BhQ{EzLmHtSaOlNkIpWwFlScGv[wR`j@sSx]{I|OqHds@oc@pR_O`N_OdOuM`e@uRtc@yZbO{FjK_C~WuB|^fAp\\tAxVi@fNiBpVeIba@yUz]_Tv[kPbSeGpRcDlRuAdV[bQ{A|K_CnJ{D`PqLtIwKfHaPdKmZtE{LpIoNvI}JxRyNnRuIfRkLdc@mf@zo@ku@hb@ge@jRyRtNwIrd@kO`G_JjEO`CdBrCjIvE`ChS~DrLMtFRrFt@bGxBlKxEzL|CpFxBzFxFlBrCkBxAb@z@MdBOlDxAxDbFfIjE|H\\~Cd@hAxDxAfEbBpCtFdAhBpCr@~AbAhBjC~BjI`@~CkDxIzBpPrBfGjEtGnDzFMl@Q|AlBjD~ExCXzBR~@vCvBnAn@Yr@{@hCeAzFl@pAx@pLvBvK~FfN`JvLpDjCNBHL[jBqA?";

function createPathFromPolyline(encodedPolyline: string, stops: Waypoint[]): Waypoint[] {
    const pathPoints = decodePolyline(encodedPolyline);
    const waypoints: Waypoint[] = pathPoints.map(p => ({ lat: p.lat, lng: p.lng }));

    // For each stop, find the nearest point on the path and attach stop metadata
    for (const stop of stops) {
        if (!stop.isStop) continue;

        let nearestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < waypoints.length; i++) {
            const dist = calculateDistance(stop.lat, stop.lng, waypoints[i].lat, waypoints[i].lng);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }

        waypoints[nearestIdx].isStop = stop.isStop;
        waypoints[nearestIdx].name = stop.name;
        waypoints[nearestIdx].stopDurationMinutes = stop.stopDurationMinutes;
    }

    return waypoints;
}

const RAW_ROUTES: { id: string, name: string, shortName: string, totalDistanceKm: number, averageSpeedKmh: number, stops: Waypoint[], polyline: string }[] = [
    // ── Route A: Colombo → Kandy Express ─────────────────────────────────────
    {
        id: 'route-001',
        name: 'Colombo - Kandy Express',
        shortName: 'CBK-EXP',
        totalDistanceKm: 115,
        averageSpeedKmh: 45,
        polyline: KANDY_POLYLINE,
        stops: [
            { lat: 6.9271, lng: 79.8612, name: 'Colombo Fort', isStop: true, stopDurationMinutes: 3 },
            { lat: 6.9351, lng: 79.8512, name: 'Pettah', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.9451, lng: 79.8672, name: 'Dematagoda', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.9901, lng: 79.9212, name: 'Kiribathgoda', isStop: true, stopDurationMinutes: 2 },
            { lat: 7.0231, lng: 79.9512, name: 'Kadawatha', isStop: true, stopDurationMinutes: 2 },
            { lat: 7.1121, lng: 80.0512, name: 'Nittambuwa', isStop: true, stopDurationMinutes: 2 },
            { lat: 7.1821, lng: 80.1912, name: 'Warakapola', isStop: true, stopDurationMinutes: 2 },
            { lat: 7.2181, lng: 80.2712, name: 'Kegalle', isStop: true, stopDurationMinutes: 3 },
            { lat: 7.2581, lng: 80.4212, name: 'Mawanella', isStop: true, stopDurationMinutes: 2 },
            { lat: 7.2691, lng: 80.5012, name: 'Kadugannawa', isStop: true, stopDurationMinutes: 2 },
            { lat: 7.2856, lng: 80.5937, name: 'Peradeniya', isStop: true, stopDurationMinutes: 2 },
            { lat: 7.2906, lng: 80.6337, name: 'Kandy Bus Stand', isStop: true, stopDurationMinutes: 3 },
        ],
    },

    // ── Route B: Colombo → Galle Highway ─────────────────────────────────────
    {
        id: 'route-002',
        name: 'Colombo - Galle Highway',
        shortName: 'CGL-HWY',
        totalDistanceKm: 126,
        averageSpeedKmh: 55,
        polyline: GALLE_POLYLINE,
        stops: [
            { lat: 6.9271, lng: 79.8612, name: 'Colombo Fort', isStop: true, stopDurationMinutes: 3 },
            { lat: 6.8971, lng: 79.8572, name: 'Bambalapitiya', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.8751, lng: 79.8612, name: 'Wellawatta', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.8511, lng: 79.8652, name: 'Dehiwala', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.8271, lng: 79.8692, name: 'Mt. Lavinia', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.6431, lng: 79.9352, name: 'Panadura', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.5251, lng: 79.9812, name: 'Wadduwa', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.3831, lng: 80.0412, name: 'Kalutara', isStop: true, stopDurationMinutes: 3 },
            { lat: 6.2231, lng: 80.1112, name: 'Bentota', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.1431, lng: 80.1512, name: 'Ambalangoda', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.0935, lng: 80.1810, name: 'Hikkaduwa', isStop: true, stopDurationMinutes: 2 },
            { lat: 6.0535, lng: 80.2210, name: 'Galle Bus Stand', isStop: true, stopDurationMinutes: 3 },
        ],
    },
];

export const ROUTES: RouteDefinition[] = RAW_ROUTES.map(route => ({
    id: route.id,
    name: route.name,
    shortName: route.shortName,
    totalDistanceKm: route.totalDistanceKm,
    averageSpeedKmh: route.averageSpeedKmh,
    waypoints: createPathFromPolyline(route.polyline, route.stops)
}));

/**
 * Look up a route by its ID.
 */
export function getRouteById(routeId: string): RouteDefinition | undefined {
    return ROUTES.find((r) => r.id === routeId);
}
