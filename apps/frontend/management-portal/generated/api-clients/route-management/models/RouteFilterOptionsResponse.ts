/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FilterMetadata } from './FilterMetadata';
import type { RangeFilter } from './RangeFilter';
export type RouteFilterOptionsResponse = {
    directions?: Array<'OUTBOUND' | 'INBOUND'>;
    roadTypes?: Array<'NORMALWAY' | 'EXPRESSWAY'>;
    routeGroups?: Array<Record<string, any>>;
    distanceRange?: RangeFilter;
    durationRange?: RangeFilter;
    metadata?: FilterMetadata;
};

