
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Image } from 'primereact/image';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useAuth } from "../../Provider/authProvider";


const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setToken, setRefreshToken, setName, setUserType, setCoop} = useAuth();
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden');

    const apiUrl = import.meta.env.VITE_API_URL;
    const path = apiUrl + "/authen/login";
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        const logIn = {
            username: username,
            password: password
        };        
        try {
            const response = await axios.post(path,logIn);
            const { access_token, refresh_token, name, user_type, coop_list} = response.data;
            
            // Store the tokens in localStorage or secure cookie for later use
            setToken(access_token);
            setRefreshToken(refresh_token);
            setName(name);
            setUserType(user_type);
            setCoop(coop_list);
            if(response.status === 200){
                navigate("/", { replace: true });
                Swal.fire({
                    title: "สำเร็จ",
                    icon: "success",
                    confirmButtonText: "ตกลง",
                    confirmButtonColor: "#03A14C",
                    timer: 1000,
                })
            }else{
                Swal.fire({
                    title: "ไม่สำเร็จ",
                    icon: "error",
                    text: "ชื่อผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง",
                    confirmButtonText: "ตกลง",
                    confirmButtonColor: "#03A14C",
                  })
            }
            
        } catch (error) {
            console.log(error)
            if(error.message === 'Network Error'){
                Swal.fire({
                    title: "Network Error",
                    icon: "error",
                    text: "error",
                    confirmButtonText: "ตกลง",
                    confirmButtonColor: "#03A14C",
                  })
            }
            else {
                const errorStatus = error.response.status;
                if(errorStatus === 400){
                    Swal.fire({
                        title: "ไม่สำเร็จ",
                        icon: "error",
                        text: "ชื่อผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง",
                        confirmButtonText: "ตกลง",
                        confirmButtonColor: "#03A14C",
                      })
                }else{
                    Swal.fire({
                        title: "ไม่สำเร็จ",
                        icon: "error",
                        text: "error",
                        confirmButtonText: "ตกลง",
                        confirmButtonColor: "#03A14C",
                      })
                }
            }
          
        }
      };
    
    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <Image src="/logo_msc.png" alt="Image" height="150" className="mb-3" />
                            <div className="text-900 text-3xl font-medium mb-3">MILK SUPPLY CHAIN</div>
                            <span className="text-600 font-medium">ระบบฐานข้อมูลและสารสนเทศด้านกิจการโคนม</span>
                        </div>

                        <div>
                            <label htmlFor="email1" className="block text-900 text-xl font-medium mb-2">
                                ชื่อผู้ใช้งาน
                            </label>
                            <InputText id="email1" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="" className="w-full md:w-30rem mb-5" style={{ padding: '1rem' }} />

                            <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                รหัสผ่าน
                            </label>
                            <Password  inputId="password1" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" feedback={false} toggleMask className="w-full mb-5" inputClassName="w-full p-3 md:w-30rem"></Password>

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    
                                </div>
                            </div>
                            <Button label="เข้าสู่ระบบ" className="w-full p-3 text-xl" onClick={handleSubmit}></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

