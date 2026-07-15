/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Details of an import warning
 */
export type ImportWarning = {
    /**
     * Row number in CSV where warning occurred
     */
    rowNumber?: number;
    /**
     * Schedule name associated with the warning
     */
    scheduleName?: string;
    /**
     * Field name that generated the warning
     */
    field?: string;
    /**
     * Warning message
     */
    warningMessage?: string;
    /**
     * Action taken
     */
    action?: string;
    /**
     * Additional details about the warning
     */
    details?: string;
};

