import * as AWS from 'aws-sdk';
import 'dotenv/config';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
});

const athena = new AWS.Athena();

interface StartQueryExecutionOutput {
    QueryExecutionId: string;
}

interface QueryExecutionResult {
    ResultSet: {
        Rows: Array<{
            Data: Array<{ VarCharValue?: string }>;
        }>;
    };
}

interface Booking {
    bookingId: string;
    noOfAdults: number;
    noOfChildren: number;
    noOfWeekendNights: number;
    noOfWeekNights: number;
    typeOfMealPlan: string;
    requiredCarParkingSpace: boolean;
    roomTypeReserved: string;
    leadTime: number;
    arrivalYear: number;
    arrivalMonth: number;
    arrivalDate: number;
    marketSegmentType: string;
    repeatedGuest: boolean;
    noOfPreviousCancellations: number;
    noOfPreviousBookingsNotCanceled: number;
    avgPricePerRoom: number;
    noOfSpecialRequests: number;
    bookingStatus: string;
}

async function startQueryExecution(query: string): Promise<StartQueryExecutionOutput> {
    const params: AWS.Athena.StartQueryExecutionInput = {
        QueryString: query,
        QueryExecutionContext: {
            Database: 'doctorew-travel-dataset-arg', // Replace with your actual database name
        },
        ResultConfiguration: {
            OutputLocation: 's3://doctorew-dataset-traveltrends-output/', // Replace with your actual output location
        },
    };
    try {
        const output = await athena.startQueryExecution(params).promise();
        if (!output.QueryExecutionId) {
            throw new Error('QueryExecutionId is undefined');
        }
        return { QueryExecutionId: output.QueryExecutionId };
    } catch (error) {
        console.error('Error starting query execution:', error);
        throw error;
    }
}
/*
* function getQueryResults(queryExecutionId: string): Promise<QueryExecutionResult> {
    const params: AWS.Athena.GetQueryResultsInput = {
        QueryExecutionId: queryExecutionId,
    };

    return new Promise((resolve, reject) => {
        const checkIfExecutionIsReady = () => {
            athena.getQueryExecution({ QueryExecutionId: queryExecutionId }).promise()
                .then((queryInfo: AWS.Athena.GetQueryExecutionOutput) => {
                    if (queryInfo.QueryExecution?.Status?.State === 'SUCCEEDED') {
                        athena.getQueryResults(params).promise()
                            .then((result: AWS.Athena.GetQueryResultsOutput) => {
                                if (!result.ResultSet) {
                                    throw new Error('ResultSet is undefined');
                                }
                                resolve(result as unknown as QueryExecutionResult);
                            }).catch(reject);
                    } else if (queryInfo.QueryExecution?.Status?.State === 'FAILED' || queryInfo.QueryExecution?.Status?.State === 'CANCELLED') {
                        reject(new Error(`Query failed to run with state: ${queryInfo.QueryExecution?.Status?.State}`));
                    } else {
                        // If the query is still running, check again after some time
                        setTimeout(checkIfExecutionIsReady, 500); // Adjust the timeout as needed
                    }
                })
                .catch(reject);
        };

        checkIfExecutionIsReady();
    });
}

* */
function getQueryResults(queryExecutionId: string): Promise<QueryExecutionResult> {
    const params: AWS.Athena.GetQueryResultsInput = {
        QueryExecutionId: queryExecutionId,
    };

    return new Promise((resolve, reject) => {
        const checkIfExecutionIsReady = () => {
            athena.getQueryExecution({ QueryExecutionId: queryExecutionId }).promise()
                .then((queryInfo: AWS.Athena.GetQueryExecutionOutput) => {
                    if (queryInfo.QueryExecution?.Status?.State === 'SUCCEEDED') {
                        console.log('|-o-| athena',athena);
                        athena.getQueryResults(params).promise()
                            .then((result: AWS.Athena.GetQueryResultsOutput) => {
                                console.log('|-o-| result',result);
                                if (!result.ResultSet) {
                                    throw new Error('ResultSet is undefined');
                                }
                                resolve(result as unknown as QueryExecutionResult);
                            }).catch(reject);
                    } else if (queryInfo.QueryExecution?.Status?.State === 'FAILED' || queryInfo.QueryExecution?.Status?.State === 'CANCELLED') {
                        console.log('|-o-|',queryInfo);
                        reject(new Error(`Query failed to run with state: ${queryInfo.QueryExecution?.Status?.State}`));
                    } else {
                        // If the query is still running, check again after some time
                        setTimeout(checkIfExecutionIsReady, 500); // Adjust the timeout as needed
                    }
                })
                .catch((error) => {
                    console.error('Query failed:', error);
                    if (error.code === 'InvalidRequestException') {
                        // If you have access to the queryInfo object here, you can log more details
                        console.error('QueryExecutionId:', queryExecutionId);
                        console.error('Detailed Error:', error.message);
                    }
                    reject(error);
                });

        };

        checkIfExecutionIsReady();
    });
}

const travelDataResolvers = {
    Query: {
        bookings: async (): Promise<Booking[]> => {
            try {
                const startQueryResponse = await startQueryExecution('SELECT * FROM "doctorew_dataset_traveltrends" WHERE no_of_adults IS NOT NULL limit 10');



                const queryExecutionId = startQueryResponse.QueryExecutionId;
                const results = await getQueryResults(queryExecutionId);
                return results.ResultSet.Rows.slice(1).map(row => {
                    const columns = row.Data.map(column => column.VarCharValue);
                    console.log('|-o-| columns',columns);
                    return {
                        bookingId: columns[0]!,
                        noOfAdults: parseInt(columns[1]!),
                        noOfChildren: parseInt(columns[2]!),
                        noOfWeekendNights: parseInt(columns[3]!),
                        noOfWeekNights: parseInt(columns[4]!),
                        typeOfMealPlan: columns[5]!,
                        requiredCarParkingSpace: columns[6]! === 'true',
                        roomTypeReserved: columns[7]!,
                        leadTime: parseInt(columns[8]!),
                        arrivalYear: parseInt(columns[9]!),
                        arrivalMonth: parseInt(columns[10]!),
                        arrivalDate: parseInt(columns[11]!),
                        marketSegmentType: columns[12]!,
                        repeatedGuest: columns[13]! === 'true',
                        noOfPreviousCancellations: parseInt(columns[14]!),
                        noOfPreviousBookingsNotCanceled: parseInt(columns[15]!),
                        avgPricePerRoom: parseFloat(columns[16]!),
                        noOfSpecialRequests: parseInt(columns[17]!),
                        bookingStatus: columns[18]!,
                    };
                });
            } catch (error) {
                console.error('Error in bookings resolver:', error);
                throw new Error('Error fetching bookings data');
            }
        },
        bookingById: async (_: any, { id }: { id: string }): Promise<Booking | null> => {
            try {
                const startQueryResponse = await startQueryExecution(`SELECT * FROM "doctorew_dataset_traveltrends" WHERE booking_id = '${id}'`); // Replace with your actual table name
                const queryExecutionId = startQueryResponse.QueryExecutionId;
                const result = await getQueryResults(queryExecutionId);
                const row = result.ResultSet.Rows[1]; // Skip header row and get the first result
                if (!row) {
                    return null; // No result found
                }
                const columns = row.Data.map(column => column.VarCharValue);
                return {
                    bookingId: columns[0]!,
                    noOfAdults: parseInt(columns[1]!),
                    noOfChildren: parseInt(columns[2]!),
                    noOfWeekendNights: parseInt(columns[3]!),
                    noOfWeekNights: parseInt(columns[4]!),
                    typeOfMealPlan: columns[5]!,
                    requiredCarParkingSpace: columns[6]! === 'true',
                    roomTypeReserved: columns[7]!,
                    leadTime: parseInt(columns[8]!),
                    arrivalYear: parseInt(columns[9]!),
                    arrivalMonth: parseInt(columns[10]!),
                    arrivalDate: parseInt(columns[11]!),
                    marketSegmentType: columns[12]!,
                    repeatedGuest: columns[13]! === 'true',
                    noOfPreviousCancellations: parseInt(columns[14]!),
                    noOfPreviousBookingsNotCanceled: parseInt(columns[15]!),
                    avgPricePerRoom: parseFloat(columns[16]!),
                    noOfSpecialRequests: parseInt(columns[17]!),
                    bookingStatus: columns[18]!,
                };
            } catch (error) {
                console.error('Error in bookingById resolver:', error);
                throw new Error('Error fetching booking by ID');
            }
        },

        // Add other resolvers based on your GraphQL schema here
    },
    // Add other type resolvers if needed based on your GraphQL schema
};

export default travelDataResolvers;
