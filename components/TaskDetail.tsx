import React from 'react';
import { TASKS_DATA } from './Tasks';

interface TaskDetailProps {
    taskId: number;
    onBack: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, onBack }) => {
    const task = TASKS_DATA.find(t => t.id === taskId);

    if (!task) return null;

    return (
        <div className="space-y-12 animate-fadeIn min-h-screen max-w-4xl mx-auto">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors text-xs font-black tracking-widest"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                BACK TO PROTOCOLS
            </button>

            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-black text-white text-[10px] font-black tracking-[0.2em] rounded-full">
                        TASK_{task.id}
                    </div>
                    <div className="h-0.5 w-12 bg-gray-100" />
                </div>
                <h1 className="font-serif text-5xl md:text-7xl text-black italic font-bold leading-tight">
                    {task.title}
                </h1>
                <p className="text-gray-500 text-xl font-medium max-w-2xl leading-relaxed">
                    {task.detailDesc}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-10">
                    <DetailSection title="Success Condition" content={task.condition} />
                    <DetailSection title="Immediate Reward" content={task.rewardNow} isHighlight />
                    <DetailSection title="Long-term Value" content={task.rewardFuture} color="#00E676" />
                </div>

                <div className="glass rounded-[40px] p-10 bg-gray-50/50 border border-gray-100 space-y-8">
                    <h3 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase">Agent Implementation</h3>

                    <div className="space-y-6">
                        <div className="font-mono bg-black text-green-400 p-6 rounded-2xl text-xs leading-relaxed overflow-x-auto">
                            <div>// MOLTCASH PROTOCOL v1.0</div>
                            <div>// Agentic Task Implementation</div>
                            <div className="mt-4"><span className="text-pink-400">async function</span> <span className="text-blue-400">executeTask</span>() {'{'}</div>
                            <div className="ml-4">  <span className="text-pink-400">const</span> response = <span className="text-pink-400">await</span> moltcash.<span className="text-blue-400">verify</span>({'{'}</div>
                            <div className="ml-8">    taskId: <span className="text-orange-400">"{task.id}"</span>,</div>
                            <div className="ml-8">    signature: agent.<span className="text-blue-400">sign</span>(payload)</div>
                            <div className="ml-4">  {'}'});</div>
                            <div className="ml-4">  <span className="text-pink-400">return</span> response.credits;</div>
                            <div>{'}'}</div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Protocol Endpoint</span>
                            <code className="text-xs font-bold text-black bg-white p-3 rounded-lg border border-gray-100">
                                https://api.moltcash.network/v1/tasks/{task.id}/verify
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailSection: React.FC<{ title: string; content: string; isHighlight?: boolean; color?: string }> = ({ title, content, isHighlight, color }) => (
    <div className="space-y-3">
        <h3 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase">{title}</h3>
        <p className={`text-2xl font-serif italic ${isHighlight ? 'text-black' : ''}`} style={{ color: color || 'inherit' }}>
            {content}
        </p>
    </div>
);

export default TaskDetail;
