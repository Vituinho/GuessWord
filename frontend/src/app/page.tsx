"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { LobbyShell } from "@/components/lobby/LobbyShell";
import { Topbar } from "@/components/layout/Topbar";
import { MetricsGrid } from "@/components/game/MetricsGrid";
import { SidePanel } from "@/components/game/SidePanel";
import { ChallengePanel } from "@/components/game/ChallengePanel";
import { HistoryPanel } from "@/components/game/HistoryPanel";
import { useGameState } from "@/hooks/useGameState";
import { modeLabels, levels } from "@/lib/vocabulary";

export default function Home() {
  const state = useGameState();

  if (!state.currentUser) {
    return (
      <AuthShell
        authMode={state.authMode}
        switchAuthMode={state.switchAuthMode}
        submitAuth={state.submitAuth}
        loginName={state.loginName}
        setLoginName={state.setLoginName}
        loginEmail={state.loginEmail}
        setLoginEmail={state.setLoginEmail}
        loginPassword={state.loginPassword}
        setLoginPassword={state.setLoginPassword}
        loginPasswordConfirmation={state.loginPasswordConfirmation}
        setLoginPasswordConfirmation={state.setLoginPasswordConfirmation}
        loginNationality={state.loginNationality}
        setLoginNationality={state.setLoginNationality}
        loginError={state.loginError}
        authLoading={state.authLoading}
        startGoogleLogin={state.startGoogleLogin}
      />
    );
  }

  if (!state.gameStarted) {
    return <LobbyShell clueMode={state.clueMode} setClueMode={state.setClueMode} startGame={state.startGame} />;
  }

  return (
    <main className="app-shell">
      <Topbar 
        apiOnline={state.apiOnline} 
        lang={state.lang} 
        toggleLanguage={state.toggleLanguage} 
        logout={state.logout} 
      />

      <MetricsGrid stats={state.stats} studyState={state.studyState} combo={state.combo} />

      <div className="workspace-grid">
        <SidePanel
          currentUser={state.currentUser}
          stats={state.stats}
          mode={state.mode}
          setMode={state.setMode}
          modeLabels={modeLabels}
          clueMode={state.clueMode}
          setClueMode={state.setClueMode}
          currentWord={state.currentWord}
          initializeTilesAndBoxes={state.initializeTilesAndBoxes}
          levels={levels}
          selectedLevel={state.selectedLevel}
          setSelectedLevel={state.setSelectedLevel}
          multiplayerRoom={state.multiplayerRoom}
          createRoom={state.createRoom}
          joinCode={state.joinCode}
          setJoinCode={state.setJoinCode}
          joinRoom={state.joinRoom}
          leaveRoom={state.leaveRoom}
        />

        <ChallengePanel
          multiplayerRoom={state.multiplayerRoom}
          currentWord={state.currentWord}
          timeLeft={state.timeLeft}
          timerRatio={state.timerRatio}
          lang={state.lang}
          clueMode={state.clueMode}
          guessedLetters={state.guessedLetters}
          feedback={state.feedback}
          submitAnimation={state.submitAnimation}
          removeLetterAtIndex={state.removeLetterAtIndex}
          tiles={state.tiles}
          handleTileClick={state.handleTileClick}
          handleBackspace={state.handleBackspace}
          handleClear={state.handleClear}
          handleReshuffle={state.handleReshuffle}
          submitAnswer={state.submitAnswer}
          speakWord={state.speakWord}
          beginRound={state.beginRound}
          feedbackTitle={state.feedbackTitle}
          currentProgress={state.currentProgress}
        />

        <HistoryPanel
          studyState={state.studyState}
          leaderboard={state.leaderboard}
          multiplayerRoom={state.multiplayerRoom}
          formatDateTime={state.formatDateTime}
        />
      </div>
    </main>
  );
}
