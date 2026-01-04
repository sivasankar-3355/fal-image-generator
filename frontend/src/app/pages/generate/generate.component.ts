import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Character } from '../../services/api.service';
import { MessageService } from 'primeng/api';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-generate',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        SelectModule,
        TextareaModule,
        ButtonModule,
        ImageModule,
        ToastModule,
        ProgressSpinnerModule
    ],
    providers: [MessageService],
    templateUrl: './generate.component.html',
    styleUrls: ['./generate.component.scss']
})
export class GenerateComponent implements OnInit {
    characters: Character[] = [];
    selectedCharacter: string | null = null;
    prompt: string = '';

    loadingCharacters = false;
    generating = false;
    generatedImageUrls: string[] = [];

    constructor(private apiService: ApiService, private messageService: MessageService) { }

    ngOnInit() {
        this.loadCharacters();
    }

    loadCharacters() {
        this.loadingCharacters = true;
        this.apiService.getCharacters().subscribe({
            next: (res) => {
                this.characters = res.data.characters;
                this.loadingCharacters = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load characters' });
                this.loadingCharacters = false;
            }
        });
    }

    generate() {
        if (!this.selectedCharacter || !this.prompt) return;

        this.generating = true;
        this.generatedImageUrls = []; // Clear previous images

        this.apiService.generateImage(this.prompt, this.selectedCharacter, 1).subscribe({
            next: (res) => {
                const inferenceId = res.data.inferenceId;
                this.pollStatus(inferenceId);
            },
            error: (err) => {
                this.generating = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Generation failed to start' });
            }
        });
    }

    pollStatus(inferenceId: string) {
        const interval = setInterval(() => {
            this.apiService.checkInferenceStatus(inferenceId).subscribe({
                next: (res) => {
                    if (res.data.status === 'COMPLETED') {
                        clearInterval(interval);
                        this.loadResult(inferenceId);
                    } else if (res.data.status === 'FAILED') {
                        clearInterval(interval);
                        this.generating = false;
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Generation failed' });
                    }
                },
                error: () => {
                    clearInterval(interval);
                    this.generating = false;
                }
            });
        }, 2000); // Poll every 2 seconds
    }

    loadResult(inferenceId: string) {
        this.apiService.getInferenceResult(inferenceId).subscribe({
            next: (res) => {
                this.generatedImageUrls = res.data.images;
                this.generating = false;
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Image generated successfully!' });
            },
            error: () => {
                this.generating = false;
                this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Could not load generated image' });
            }
        });
    }
}
