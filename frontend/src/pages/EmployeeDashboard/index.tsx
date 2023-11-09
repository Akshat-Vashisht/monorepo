import React from 'react';
import DataPointDescriptive from '../../components/DataPointDescriptive';
import HomeWidget from '../../components/HomeWidget';
import ProgressBar from '../../components/ProgressBar';
import ProgressCircle from '../../components/ProgressCircle';

import './EmployeeDashboard.css';

export default function EmployeeDashboard() {
    return(
        <div className="employee-dashboard-container">
            <DataPointDescriptive
                description='Performance'
                subtext='Your weighted reviews over time'
                // helpLink='What is driving your score?'
                onHelpLinkClick={() => console.log("help clicked")}
            >
                <ProgressBar description='Average 3.4' progress={68} />
            </DataPointDescriptive>
            <DataPointDescriptive
                description='Your pay'
                subtext='Against your level in your area'
                // helpLink='What goes into my pay (and how do I get more)?'
                onHelpLinkClick={() => console.log("help clicked")}
            >
                <ProgressBar description='% of Median: 82%' progress={82} />
            </DataPointDescriptive>
            <DataPointDescriptive
                description='Raise Cycle'
                subtext='Your company budgets in raises for high performers at specfic times'
                // helpLink='How do I qualify for a raise?'
                onHelpLinkClick={() => console.log("raise cycle clicked")}
            >
                <div className='employee-dashboard-raise'>
                    <div className='employee-dashboard-raise-text'>
                        <h1>Your next raise cycle is in:</h1>
                    </div>
                    <div className='employee-dashboard-raise-text'>
                        <h1>July 2023</h1>
                    </div>
                </div>
            </DataPointDescriptive>
            <DataPointDescriptive
                description='Areas of Improvement'
                // helpLink='What resources do we have to help me fix these things?'
                onHelpLinkClick={() => console.log('aoi clicked')}
            >
                <div>
                    <span className='employee-dashboard-aoi-header'>
                        <h3>Based on your last few performance reports, you could improve on:</h3>
                    </span>
                    <ul>
                        <li>Setting and meeting deadlines</li>
                        <li>Proofreading your reports</li>
                        <li>Making your presentations clearer</li>
                    </ul>
                </div>
            </DataPointDescriptive>
            <DataPointDescriptive
                description='Recently completed'
                // helpLink='Where do I add, complete, or put aside projects?'
                onHelpLinkClick={() => console.log('rc clicked')}
            >
                <div className='employee-dashboard-rc'>
                    <HomeWidget 
                            mainText='Build homepage design'
                            subText='' 
                        >
                            <ProgressCircle description='3.4' progress={56} styles={{text: {fill: '#041F4C', fontSize: '24px', fontWeight: 600}}} />
                        </HomeWidget>
                        <HomeWidget 
                            mainText='Present Quarterly Report'
                            subText='' 
                        >
                            <ProgressCircle description='4.5' progress={90} styles={{text: {fill: '#041F4C', fontSize: '24px', fontWeight: 600}}} />
                        </HomeWidget>
                        <HomeWidget 
                            mainText='Complete New Hire Training'
                            subText='' 
                        >
                            <ProgressCircle description='1.2' progress={12} styles={{text: {fill: '#041F4C', fontSize: '24px', fontWeight: 600}}} />
                        </HomeWidget>
                </div>
            </DataPointDescriptive>
            <DataPointDescriptive
                description='Skills Needed for Next Promotion'
                // helpLink='How do I develop new skills?'
                onHelpLinkClick={() => console.log('Skills clicked')}
            >
                <table className='employee-dashboard-skills-table'>
                    <thead>
                        <tr>
                            <th>
                                Skill
                            </th>
                            <th>
                                Proficiency
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                    <tr>
                            <td>
                                Design
                            </td>
                            <td>
                                <ProgressBar progress={32} />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                People Management
                            </td>
                            <td>
                                <ProgressBar progress={21} />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Financial Modeling
                            </td>
                            <td>
                                <ProgressBar progress={65} />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Budgeting
                            </td>
                            <td>
                                <ProgressBar progress={83} />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Task Management
                            </td>
                            <td>
                                <ProgressBar progress={70} />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </DataPointDescriptive>
        </div>
    )
}