export interface ReceiveData<T> {
    Success: boolean;

    Data: T;

    Status: string;

    StatusCode: number;
}

export interface SendData {
    Method: string;

    Path: string;

    Body?: any;
}

export interface ReportData {
    CountSuccess: number,
    CountFailed: number,
    SPH: number,
    AverageSPH: number,
    CountRecord: number,
    CountRunning: number,
    CountThread: number,
    CountStreamPrem: number,
    CountStreamFree: number,
    CountStreamNoAccount: number,
    CountStreamAds: number
}

export interface ClientReportData {
    ReportID: number,
    ClientID: number,
    Name: string,
    Success: number,
    Failed: number,
    SPH: number,
    ThreadSize: number,
    LastUpdate: string
}

export interface ProfileReportData {
    QueuePremCount: number,
    QueueGoCount: number,
    QueueFreeCount: number,
    ProfilePremCount: number,
    ProfileGoCount: number,
    ProfileFreeCount: number,
    ProfileGoodCount: number,
    ProfileBadCount: number,
    ProfileExpiredCount: number
}

export interface Metrics {
    Date: string,
    Success: number,
    Failed: number
}

export interface SourceExcelRow {
    info?: string | null,
    network?: string | undefined,
    artist_id: string,
    album_id?: string,
    multilpier?: number,
    limit_from?: number,
    limit_to?: number,
    day_total?: number,
    month_total?: number,
}