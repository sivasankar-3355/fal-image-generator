import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';


@Component({
    selector: 'app-train',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputTextModule,
        RadioButtonModule,
        InputNumberModule,
        SelectModule,
        CardModule,
        ButtonModule
    ],
    providers: [],
    templateUrl: './train.component.html',
    styleUrls: ['./train.component.scss']
})
export class TrainComponent {
    ethinities = [
        { name: 'Asian', value: 'asian' },
        { name: 'White', value: 'white' },
        { name: 'Black', value: 'black' },
        { name: 'Other', value: 'other' }
    ]

    eyeColors = [
        { name: 'Brown', value: 'brown' },
        { name: 'Blue', value: 'blue' },
        { name: 'Green', value: 'green' },
        { name: 'Other', value: 'other' }
    ]
    constructor() { }

    // startTraining() {
    //     if (!this.character.name || this.selectedFiles.length === 0) {
    //         this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Name and images are required.' });
    //         return;
    //     }

    //     this.loading = true;
    //     const formData = new FormData();
    //     formData.append('name', this.character.name);
    //     if (this.character.age !== null) formData.append('age', this.character.age.toString());
    //     formData.append('gender', this.character.gender);
    //     formData.append('ethinicity', this.character.ethinicity);
    //     formData.append('eyeColor', this.character.eyeColor);
    //     formData.append('isBald', this.character.isBald.toString());

    //     this.selectedFiles.forEach(file => {
    //         formData.append('images', file);
    //     });

    //     this.apiService.trainModel(formData).subscribe({
    //         next: (response) => {
    //             this.loading = false;
    //             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Training started successfully!' });

    //             // Poll for status or just wait a bit and redirect (basic implementation)
    //             setTimeout(() => {
    //                 this.router.navigate(['/']);
    //             }, 1500);
    //         },
    //         error: (error) => {
    //             this.loading = false;
    //             this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start training.' });
    //             console.error(error);
    //         }
    //     });
    // }
}
