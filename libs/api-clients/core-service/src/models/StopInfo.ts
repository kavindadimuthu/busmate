/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationDto } from './LocationDto';
/**
 * Stop information summary
 */
export type StopInfo = {
    /**
     * Stop UUID
     */
    id?: string;
    /**
     * Stop name in English
     */
    name?: string;
    /**
     * Stop name in Sinhala
     */
    nameSinhala?: string;
    /**
     * Stop name in Tamil
     */
    nameTamil?: string;
    /**
     * Stop location details
     */
    location?: LocationDto;
};

