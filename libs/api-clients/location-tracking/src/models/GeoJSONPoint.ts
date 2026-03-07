/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * GeoJSON Point for location data
 */
export type GeoJSONPoint = {
    /**
     * Must be "Point"
     */
    type: GeoJSONPoint.type;
    /**
     * [longitude, latitude] coordinates
     */
    coordinates: Array<number>;
};
export namespace GeoJSONPoint {
    /**
     * Must be "Point"
     */
    export enum type {
        POINT = 'Point',
    }
}

