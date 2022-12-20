import React from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { green, red, blue, yellow } from '@mui/material/colors';
import { Box, Button, Grid, Paper, Toolbar } from '@mui/material';
import { Row, Workbook } from 'exceljs';
import ReportTable from '../component/ReportTable';
import TidalAPI from '../service/KKBoxAPI';
import Chart from '../component/Chart';
import Utils from '../Utils';
import { SourceExcelRow } from '../service/Structs';
import ImportDialog from '../component/ImportDialog';

const API = TidalAPI.Instance;

interface State {
    success_count: number,
    failed_count: number,
    sph_sum: number,
    sph_avg: number,
    stream_prem: number,
    stream_free:number,
    stream_no_account:number,
    stream_ads: number,
    client_running: number,
    thread_count: number,
    queue_prem_count: number,
    queue_go_count: number,
    queue_free_count: number,
    good_count: number,
    bad_count: number,
    expired_count: number,
    using_count: number,
    prem_count: number,
    go_count: number,
    free_count: number,
}

class Overview extends React.Component<{}, State> {

    private LoadDataInterval: any = null;

    constructor(props: {}) {
        super(props);
        this.state = {
            success_count: 0,
            failed_count: 0,
            sph_sum: 0,
            sph_avg: 0,
            stream_prem: 0,
            stream_free: 0,
            stream_no_account: 0,
            stream_ads: 0,
            client_running: 0,
            thread_count: 0,
            queue_prem_count: 0,
            queue_go_count: 0,
            queue_free_count: 0,
            good_count: 0,
            bad_count: 0,
            expired_count: 0,
            using_count: 0,
            prem_count: 0,
            go_count: 0,
            free_count: 0,
        };
    }

    public async loadData() {
        if (!API.isAuth) {
            return;
        }

        const report = await API.report.get();
        const profile = await API.report.profile();

        this.setState({
            success_count: report.CountSuccess,
            failed_count: report.CountFailed,
            sph_sum: report.SPH,
            sph_avg: report.AverageSPH,
            client_running: report.CountRunning,
            thread_count: report.CountThread,
            stream_prem: report.CountStreamPrem,
            stream_free : report.CountStreamFree,
            stream_ads : report.CountStreamAds,
            stream_no_account : report.CountStreamNoAccount,
            queue_prem_count: profile.QueuePremCount,
            queue_go_count: profile.QueueGoCount,
            queue_free_count: profile.QueueFreeCount,
            good_count: profile.ProfileGoodCount,
            bad_count: profile.ProfileBadCount,
            expired_count: profile.ProfileExpiredCount,
            using_count: profile.ProfileGoodCount - (profile.QueueFreeCount + profile.QueuePremCount + profile.QueueGoCount),
            prem_count: profile.ProfilePremCount,
            go_count: profile.ProfileGoCount,
            free_count: profile.ProfileFreeCount,
        });
    }

    public async importSource(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.files == null) {
            return;
        }

        // Read Book
        var buffer = await event.target.files[0].arrayBuffer();
        var book = new Workbook();
        await book.xlsx.load(buffer);
        var sheet = book.getWorksheet("source");
        event.target.value = "";

        // Create Map
        var source_map = new Map<string, SourceExcelRow>();
        sheet.eachRow({ includeEmpty: false }, (row: Row, index: number) => {
            if (index == 1) return;
            var info = row.findCell(1)?.text.trim();
            var network = row.findCell(2)?.text.trim();
            var artist_id = row.findCell(3)?.text.trim();
            var album_id = row.findCell(4)?.text.trim();
            var multilpier = row.findCell(5)?.value;
            var limit_from = row.findCell(6)?.value;
            var limit_to = row.findCell(7)?.value;

            // Nếu album và artist đều rỗng thì sẽ bỏ qua.
            if (Utils.StringIsNullOrEmpty(album_id) && Utils.StringIsNullOrEmpty(artist_id)) {
                return;
            }
            // Nếu album không rỗng thì xử lý nội dung album.
            if (album_id?.includes('/')) {
                album_id = album_id.split('\n').map(x => {
                    const split = x.split('/');
                    return split[split.length - 1].trim();
                }).join('\n');
            }
            else {
                album_id = album_id?.trim();
            }
            // Nếu artist rỗng thì tạo artist dựa trên album
            if (artist_id == null || artist_id.length == 0) {
                const id = album_id?.split('\n')[0];
                artist_id = `anony_${id}`;
            }
            // Ngược lại xử lý nội dung artist
            else if (artist_id.includes('/')) {
                const split = artist_id.split('/');
                artist_id = split[split.length - 1].trim();
            }

            if (typeof multilpier != 'number') {
                //if (this.OnLog) this.OnLog('warnning', i, "Trường MULTILPIER phải ở định dạng số.");
                multilpier = 0;
            }
            if (typeof limit_from != 'number') {
                //if (this.OnLog) this.OnLog('warnning', i, "Trường LIMIT_FROM phải ở định dạng số.");
                limit_from = 0;
            }
            if (typeof limit_to != 'number') {
                //if (this.OnLog) this.OnLog('warnning', i, "Trường LIMIT_TO phải ở định dạng số.");
                limit_to = 0;
            }

            if (source_map.has(artist_id)) {
                if (album_id != null) {
                    const source = source_map.get(artist_id);
                    if (source != null) {
                        if (source.album_id != null) {
                            source.album_id += '\n' + album_id;
                        }
                        else {
                            source.album_id = album_id;
                        }
                    }
                }
            }
            else {
                source_map.set(artist_id, {
                    info: info,
                    network: network,
                    artist_id: artist_id,
                    album_id: album_id,
                    multilpier: multilpier,
                    limit_from: limit_from,
                    limit_to: limit_to
                });
            }

        });
        console.log(source_map);

        // Find Diff
        const remove_list: string[] = [];
        const update_list: SourceExcelRow[] = [];
        var sources = await API.source.export();
        sources.forEach((source) => {
            var diff = source_map.get(source.artist_id);
            var is_changed = false;
            if (diff == null) {
                remove_list.push(source.artist_id);
                return;
            }

            if (diff.info != source.info) {
                is_changed = true;
            }
            else {
                delete diff.info;
            }
            if (diff.network != source.network) {
                is_changed = true;
            }
            else {
                delete diff.network;
            }
            if (diff.album_id != source.album_id) {
                is_changed = true;
            }
            else {
                delete diff.album_id;
            }
            if (diff.multilpier != source.multilpier) {
                is_changed = true;
            }
            else {
                delete diff.multilpier;
            }
            if (diff.limit_from != source.limit_from) {
                is_changed = true;
            }
            else {
                delete diff.limit_from;
            }
            if (diff.limit_to != source.limit_to) {
                is_changed = true;
            }
            else {
                delete diff.limit_to;
            }

            if (!is_changed) {
                source_map.delete(source.artist_id);
            }
        });
        for (let source of source_map.values()) {
            update_list.push(source);
        }

        console.log(remove_list);
        console.log(update_list);

        await API.source.remove(remove_list);
        await API.source.import(update_list);
    }

    public async exportSource() {
        // Create Book
        var book = new Workbook();
        var sheet = book.addWorksheet("source");

        // Add Header
        var headers = ["INFO", "NETWORK", "ARTIST_ID", "ALBUM_ID","MULTILPIER", "LIMIT_FROM", "LIMIT_TO", "DAY_TOTAL", "MONTH_TOTAL"]
        var cols: any[] = [];
        headers.forEach((h) => cols.push({ header: h, width: 15 }));
        sheet.columns = cols;

        // Add Row
        var sources = await API.source.export();
        var rows: any[] = [];
        sources.forEach((s) => rows.push([
            s.info,
            s.network,
            s.artist_id,
            s.album_id,
            s.multilpier,
            s.limit_from,
            s.limit_to,
            s.day_total,
            s.month_total
        ]));
        sheet.addRows(rows);

        // Download File
        var buffer = await book.xlsx.writeBuffer();
        Utils.SaveFile('SoundCloud.xlsx', buffer);
    }

    // Được gọi khi Component được khởi tạo.
    public componentDidMount() {
        this.loadData();
        this.LoadDataInterval = setInterval(() => {
            if (document.visibilityState === "visible") {
                this.loadData();
            }
        }, 3000);
    }

    // Được gọi khi Component được xóa bỏ.
    public componentWillUnmount() {
        clearInterval(this.LoadDataInterval);
    }

    // Được gọi khi Component được vẽ.
    public render(): React.ReactNode {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>

                    <Grid item xs={12} md={3}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                background: green[400]
                            }}
                            elevation={4}
                        >
                            Success Count
                            <Typography variant="h4" noWrap>{this.state.success_count}</Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                background: red[400]
                            }}
                            elevation={4}
                        >
                            Failed Count
                            <Typography variant="h4" noWrap>{this.state.failed_count}</Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                background: yellow[400]
                            }}
                            elevation={4}
                        >
                            SPH Sum
                            <Typography variant="h4" noWrap>{this.state.sph_sum}</Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                background: blue[400]
                            }}
                            elevation={4}
                        >
                            SPH Avg
                            <Typography variant="h4" noWrap>{this.state.sph_avg}</Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                background: green[200]
                            }}
                            elevation={4}
                        >
                            Stream Prem
                            <Typography variant="h4" noWrap>{this.state.stream_prem}</Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                background: green[200]
                            }}
                            elevation={4}
                        >
                            Stream Free
                            <Typography variant="h4" noWrap>{this.state.stream_free}</Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                background: green[200]
                            }}
                            elevation={4}
                        >
                            Stream No Account
                            <Typography variant="h4" noWrap>{this.state.stream_no_account}</Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                background: green[200]
                            }}
                            elevation={4}
                        >
                            Stream Ads
                            <Typography variant="h4" noWrap>{this.state.stream_ads}</Typography>
                        </Paper>
                    </Grid>

                    

                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: 240,
                                pb: 1
                            }}
                            elevation={4}
                        >
                            <Box
                                sx={{
                                    pt: 2,
                                    pl: 2,
                                    pr: 2
                                }}
                            >
                                Client Running
                                <Typography variant="h6" noWrap>{this.state.client_running} ({this.state.thread_count} Thread)</Typography>
                                Profile Queue Go+/Go/Free
                                <Typography variant="h6" noWrap>{this.state.queue_prem_count}/{this.state.queue_go_count}/{this.state.queue_free_count}</Typography>
                                Profile Good/Bad/Expried/Using
                                <Typography variant="h6" noWrap>{this.state.good_count}/{this.state.bad_count}/{this.state.expired_count}/{this.state.using_count}</Typography>
                                Profile Go+/Go/Free
                                <Typography variant="h6" noWrap>{this.state.prem_count}/{this.state.go_count}/{this.state.free_count}</Typography>
                                
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Paper
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: 240,
                                pr: 2,
                                pb: 1
                            }}
                            elevation={4}
                        >
                            <Toolbar
                                sx={{
                                    pl: { sm: 2 },
                                    pr: { xs: 1, sm: 1 },
                                }}
                            >
                                <Typography
                                    sx={{ flex: '1 1 100%' }}
                                    variant="h6"
                                    id="tableTitle"
                                    component="div"
                                >
                                    Report Chart
                                </Typography>
                            </Toolbar>
                            <Chart />
                        </ Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                p: 1
                            }}
                            elevation={4}
                        >
                            <Box>
                                <Typography
                                    sx={{ flex: '1 1 100%', m: 1 }}
                                    variant="h6"
                                    component="div"
                                >
                                    Source
                                </Typography>
                                <Button variant="contained" onClick={this.exportSource}>
                                    Export
                                </Button>
                                <Button variant="contained" component="label" sx={{ ml: 1 }}>
                                    Import
                                    <input hidden type="file" onChange={this.importSource} />
                                </Button>
                            </Box>
                        </ Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <ReportTable />
                    </Grid>
                </Grid>
                
            </Container>
        );
    }
}

export default Overview;