import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormGroup, Switch, TextField } from '@mui/material';
import React, { ChangeEvent, useState } from 'react';
import { MeritIncreaseSetting } from '../../types';

import './MeritIncreaseEditor.css';

interface MeritIncreaseEditorProps {
    meritIncreaseSettings: MeritIncreaseSetting[];
    onMeritIncreaseSettingsUpdate: (m: MeritIncreaseSetting[]) => void;
    includeMeritIncrease: boolean;
    onIncludeMeritIncreaseUpdate: (b: boolean) => void;
}



export default function MeritIncreaseEditor(props: MeritIncreaseEditorProps) {
    const { 
        meritIncreaseSettings, 
        onMeritIncreaseSettingsUpdate,
        includeMeritIncrease,
        onIncludeMeritIncreaseUpdate,
    } = props;
    const [misCopy, setMisCopy] = useState<MeritIncreaseSetting[]>(meritIncreaseSettings.map(mis => ({...mis})));
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const onCloseModal = () => {
        setIsEditModalOpen(false);
    }

    const onSettingEdit = (idx: number, field: keyof MeritIncreaseSetting, value: number) => {
        misCopy[idx][field] = value;
        setMisCopy([...misCopy]);
    }

    const onSaveEdit = () => {
        onMeritIncreaseSettingsUpdate(misCopy);
        onCloseModal();
    }

    const onOpenModal = () => {
        setMisCopy(meritIncreaseSettings.map(mis => ({...mis})));
        setIsEditModalOpen(true);
    }

    const onRemoveSetting = (idx: number) => {
        misCopy.splice(idx, 1)
        setMisCopy([...misCopy]);
    }

    const onAddSetting = () => {
        setMisCopy([...misCopy, {scoreStart: 0, scoreEnd: 0, percentageIncrease: 0}])
    }

    const renderEditModal = () => {
        return(
            <Dialog
                open={isEditModalOpen}
                onClose={onCloseModal}
            >
                <DialogTitle>Edit Merit Increase settings</DialogTitle>
                <DialogContent>
                    <FormControl>
                        {misCopy.map((mis,idx) => 
                            <div 
                                key={`edit-setting-${idx}`}
                                className='merit-increase-setting-modal-row'
                            >
                                <TextField
                                    required
                                    type="number"
                                    margin="dense"
                                    id="scoreStart"
                                    label="Score start"
                                    fullWidth
                                    variant="standard"
                                    helperText={idx === 0 && "Inclusive"}
                                    value={mis.scoreStart}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => onSettingEdit(idx, "scoreStart", e.target.valueAsNumber)}
                                    className='merit-increase-setting-modal-input'
                                    sx={{margin: '8px'}}
                                />
                                <TextField
                                    required
                                    type="number"
                                    margin="dense"
                                    id="scoreEnd"
                                    label="Score End"
                                    fullWidth
                                    variant="standard"
                                    helperText={idx === 0 && "Exclusive"}
                                    value={mis.scoreEnd}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => onSettingEdit(idx, "scoreEnd", e.target.valueAsNumber)}
                                    className='merit-increase-setting-modal-input'
                                    sx={{margin: '8px'}}
                                />
                                <TextField
                                    required
                                    type="number"
                                    margin="dense"
                                    id="percentage"
                                    label="Percentage"
                                    fullWidth
                                    variant="standard"
                                    helperText={idx === 0 && "As whole number"}
                                    value={mis.percentageIncrease}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => onSettingEdit(idx, "percentageIncrease", e.target.valueAsNumber)}
                                    className='merit-increase-setting-modal-input'
                                    sx={{margin: '8px'}}
                                />
                                <Button onClick={() => onRemoveSetting(idx)}>X</Button>
                            </div>
                        )}
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCloseModal}>Cancel</Button>
                    <Button onClick={onAddSetting}>Add row</Button>
                    <Button onClick={onSaveEdit}>Save</Button>
                </DialogActions>
            </Dialog>
        )
    }
    return(
        <div>
            <FormGroup>
                <FormControlLabel 
                    control={<Switch 
                                checked={includeMeritIncrease} 
                                onChange={() => (onIncludeMeritIncreaseUpdate(!includeMeritIncrease))} 
                            />} 
                    label="Include Merit Increase" 
                />
            </FormGroup>
            <h4>Merit Increase Settings</h4>
            {meritIncreaseSettings.map((mis, idx) => {
                return(
                    <div className='merit-increase-editor-row' key={`editorRow${idx}`}>
                        <div>
                            {idx === 0 && <span>Score range</span>}
                            <div 
                                className='merit-increase-editor-cell'
                                onClick={onOpenModal}
                            >
                                {mis.scoreStart} - {mis.scoreEnd}
                            </div>
                        </div>
                        <div>
                            {idx === 0 && <span>Percentage increase</span>}
                            <div 
                                className='merit-increase-editor-cell'
                                onClick={onOpenModal}
                            >
                                {mis.percentageIncrease}
                            </div>
                        </div>
                    </div>
                );
            })}
            {renderEditModal()}
        </div>
    );
}