/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OperatorStatisticsResponse = {
    totalOperators?: number;
    activeOperators?: number;
    inactiveOperators?: number;
    pendingOperators?: number;
    cancelledOperators?: number;
    privateOperators?: number;
    ctbOperators?: number;
    operatorsByRegion?: Record<string, number>;
    operatorsByType?: Record<string, number>;
    operatorsByStatus?: Record<string, number>;
    averageOperatorsPerRegion?: number;
    mostActiveRegion?: string;
    leastActiveRegion?: string;
    activeOperatorPercentage?: number;
};

