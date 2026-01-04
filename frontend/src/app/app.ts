import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

import { GenerateComponent } from './pages/generate/generate.component'
import { TrainComponent } from './pages/train/train.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TabsModule, GenerateComponent, TrainComponent, CardModule, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  tabsValue: number = 0;

  ngOnInit() {
  }
}
