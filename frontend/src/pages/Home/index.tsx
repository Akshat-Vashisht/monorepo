import React from 'react';
import HomeWidget from '../../components/HomeWidget';
import ProgressBar from '../../components/ProgressBar';
import ProgressCircle from '../../components/ProgressCircle';

import { 
    IoDesktopOutline, 
    IoGrid, 
    IoRocketSharp, 
    IoPerson,
} from 'react-icons/io5';
import { GiOnTarget } from 'react-icons/gi';
import { MdOutlineReviews } from 'react-icons/md';

import './Home.css';
import { useNavigate } from 'react-router-dom';
declare global {
    interface Window { _env_: any; }
}
export default function Home() {
    const navigate = useNavigate();
    return(
        <div className='home-container'>
            <div className='home-row'>
                <HomeWidget 
                    mainText='Employee Dashboard' 
                    subText='View Pay, Performance, Projects, and Skills'
                >
                    <ProgressCircle progress={60} />
                </HomeWidget>
                <HomeWidget 
                    mainText='Performance Dashboard'
                    subText='See how you performed and how each project affects your pay'
                    onClick={() => navigate("/performance")}    
                >
                    <>
                        <ProgressBar progress={80}/>
                        <ProgressBar progress={50}/>
                        <ProgressBar progress={90}/>
                        <ProgressBar progress={30}/>
                    </>
                </HomeWidget>
                <HomeWidget 
                    mainText='Pay Dashboard' 
                    subText='See how much you are paid and where you are on your pay band'
                    onClick={() => navigate("/pay")}
                >
                    <ProgressCircle description='Total Compensation' progress={60} styles={{text: {fill: '#041F4C', fontSize: '7px', fontWeight: 600}}} />
                </HomeWidget>
            </div>
            {/* <div className='home-row'>
                <HomeWidget 
                    mainText='Skills Dashboard' 
                    subText='Learn and advance your career'
                >
                    <table className="home-circle-table">
                        <tbody>
                            <tr>
                                <td>
                                    <ProgressCircle progress={30} />
                                </td>
                                <td>
                                    <ProgressCircle progress={54} />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <ProgressCircle progress={75} />
                                </td>
                                <td>
                                    <ProgressCircle progress={45} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </HomeWidget>
                <HomeWidget 
                    mainText='Career Builder'
                    subText='Browse career options and openings'    
                >
                    <table className='home-career-table'>
                        <tbody>
                            <tr>
                                <td className='home-career-table-dark'>
                                    <GiOnTarget />
                                </td>
                                <td className='home-career-table-dark'>
                                    <IoGrid />
                                </td>
                            </tr>
                            <tr>
                                <td className='home-career-table-light'>
                                    <IoDesktopOutline />
                                </td>
                                <td className='top-and-bottom-border home-career-table-dark'>
                                    <IoRocketSharp />
                                </td>
                                <td className='home-career-table-light'>
                                    <MdOutlineReviews />
                                </td>
                            </tr>
                            <tr>
                                <td className='home-career-table-light'>
                                    <IoPerson />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </HomeWidget>
                <HomeWidget 
                    mainText='Improvement Dashboard' 
                    subText='Expand your comfort zone'
                >
                    <div className='home-improvement-bars'>
                        <div className='home-improvement-bar hib-s1'>
                            <ProgressBar progress={100} />
                        </div>
                        <div className='home-improvement-bar hib-s2'>
                            <ProgressBar progress={0} />
                        </div>
                        <div className='home-improvement-bar hib-s3'>
                            <ProgressBar progress={100} />
                        </div>
                        <div className='home-improvement-bar hib-s4'>
                            <ProgressBar progress={0} />
                        </div>
                        <div className='home-improvement-bar hib-s5'>
                            <ProgressBar progress={100} />
                        </div>
                        <div className='home-improvement-bar hib-s6'>
                            <ProgressBar progress={0} />
                        </div>
                    </div>
                </HomeWidget> */}
            {/* </div> */}
        </div>
    )
}