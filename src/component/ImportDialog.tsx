import * as React from 'react';
import * as material from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import TidalAPI from '../service/KKBoxAPI';

const API = TidalAPI.Instance;

export default function ImportDialog() {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Dialog open={true} maxWidth="xs" fullWidth fullScreen={fullScreen}>
            <material.DialogTitle>Import Source</material.DialogTitle>
            <DialogContent>
                <material.DialogContentText>
                    Start import sources progress with:<br />
                    Update: 100<br />
                    Remove: 100
                </material.DialogContentText>
            </DialogContent>
            <material.DialogActions>
                <Button>Cancel</Button>
                <Button>Import</Button>
            </material.DialogActions>
        </Dialog>
    );
}