import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Character {
    _id: string;
    name: string;
}

export interface TrainingResponse {
    msg: string;
    data: {
        character: string;
    };
}

export interface InferenceResponse {
    msg: string;
    data: {
        inferenceId: string;
    }
}

export interface TrainingStatusResponse {
    msg: string;
    data: {
        status: 'PENDING' | 'COMPLETED' | 'FAILED';
    }
}

export interface InferenceStatusResponse {
    msg: string;
    data: {
        status: 'PENDING' | 'COMPLETED' | 'FAILED';
    }
}

export interface InferenceResultResponse {
    msg: string;
    data: {
        images: string[];
        prompt: string;
        characterName: string;
    }
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = '/api'; // Using proxy, or absolute URL if CORS allowed

    constructor(private http: HttpClient) { }

    getCharacters(): Observable<{ msg: string, data: { characters: Character[] } }> {
        return this.http.get<{ msg: string, data: { characters: Character[] } }>(`${this.apiUrl}/characters`);
    }

    trainModel(formData: FormData): Observable<TrainingResponse> {
        return this.http.post<TrainingResponse>(`${this.apiUrl}/train`, formData);
    }

    generateImage(prompt: string, characterId: string, count: number): Observable<InferenceResponse> {
        return this.http.post<InferenceResponse>(`${this.apiUrl}/inference`, { prompt, character: characterId, count });
    }

    checkTrainingStatus(characterId: string): Observable<TrainingStatusResponse> {
        return this.http.get<TrainingStatusResponse>(`${this.apiUrl}/check-training-status?characterId=${characterId}`);
    }

    checkInferenceStatus(inferenceId: string): Observable<InferenceStatusResponse> {
        return this.http.get<InferenceStatusResponse>(`${this.apiUrl}/check-inference-status?inferenceId=${inferenceId}`);
    }

    getInferenceResult(inferenceId: string): Observable<InferenceResultResponse> {
        return this.http.get<InferenceResultResponse>(`${this.apiUrl}/load-inferences?inferenceId=${inferenceId}`);
    }
}
