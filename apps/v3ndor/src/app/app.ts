import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  imports: [RouterModule, ToastModule],
  selector: 'app-root',
  template: `<p-toast /><router-outlet />`,
  styleUrl: './app.scss',
})
export class App {
  protected title = 'v3ndor';
}
