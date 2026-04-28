// src/components/RunEndScreen.jsx
export function RunEndScreen({ result, onReturn }) {
  const { reason, echoesEarned, goldEarned, wave } = result
  const isVictory = reason === 'victory'

  return (
    <div className="min-h-screen bg-void-950 flex items-center justify-center">
      <div className="bg-void-900 border border-gray-700 rounded-lg p-8 max-w-md w-full text-center space-y-6">
        <div className={`text-4xl font-bold ${isVictory ? 'text-gold-300' : 'text-red-400'}`}>
          {isVictory ? '⚔️ Zone Cleared!' : '💀 You Fell'}
        </div>

        <div className="text-gray-400 text-sm">
          Reached Wave {wave}
        </div>

        <div className="bg-void-800 rounded p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Echoes Earned</span>
            <span className="text-yellow-300 font-bold">+{echoesEarned}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gold Earned</span>
            <span className="text-yellow-200 font-bold">+{goldEarned}</span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {isVictory
            ? 'Your gear has been kept. Return to push deeper.'
            : 'Your gear has been kept. Spend your Echoes and try again.'}
        </div>

        <button
          onClick={onReturn}
          className="w-full py-3 bg-echo-500 hover:bg-echo-400 text-white font-bold rounded transition-colors"
        >
          Return to Hub
        </button>
      </div>
    </div>
  )
}
