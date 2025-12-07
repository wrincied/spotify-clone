import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  public userNameFormControl = new FormControl(null,[Validators.required, Validators.email]);
  public passwordFormControl = new FormControl(null,[Validators.minLength(6)]);

  public userForm!: FormGroup

  ngOnInit() {
    this.userForm = new FormGroup({
      username: this.userNameFormControl,
      password: this.passwordFormControl
    })

  }
  submit(){
    console.log(this.userForm.value)
  }
}
