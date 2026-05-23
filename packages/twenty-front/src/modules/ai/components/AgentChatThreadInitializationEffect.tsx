import { useStore } from 'jotai';
import { useEffect } from 'react';
import { isDefined, isValidUuid } from 'twenty-shared/utils';

import {
  AGENT_CHAT_NEW_THREAD_DRAFT_KEY,
  agentChatDraftsByThreadIdState,
} from '@/ai/states/agentChatDraftsByThreadIdState';
import { agentChatInputState } from '@/ai/states/agentChatInputState';
import { agentChatThreadsLoadingState } from '@/ai/states/agentChatThreadsLoadingState';
import { agentChatUsageComponentFamilyState } from '@/ai/states/agentChatUsageComponentFamilyState';
import { agentChatVisibleThreadsSelector } from '@/ai/states/selectors/agentChatVisibleThreadsSelector';
import { currentAiChatThreadState } from '@/ai/states/currentAiChatThreadState';
import { currentAiChatThreadTitleComponentFamilyState } from '@/ai/states/currentAiChatThreadTitleComponentFamilyState';
import { hasInitializedAgentChatThreadsState } from '@/ai/states/hasInitializedAgentChatThreadsState';
import { hasTriggeredCreateForDraftState } from '@/ai/states/hasTriggeredCreateForDraftState';
import { sortChatThreadsByLastActivityDesc } from '@/ai/utils/sortChatThreadsByLastActivityDesc';
import { useUpdateMetadataStoreDraft } from '@/metadata-store/hooks/useUpdateMetadataStoreDraft';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { useAtomComponentFamilyStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateCallbackState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useApolloClient } from '@apollo/client/react';
import {
  GetChatThreadsDocument,
  PermissionFlagType,
} from '~/generated-metadata/graphql';

export const AgentChatThreadInitializationEffect = () => {
  const client = useApolloClient();
  const { replaceDraft, applyChanges } = useUpdateMetadataStoreDraft();
  const hasAiSettingsPermission = useHasPermissionFlag(
    PermissionFlagType.AI_SETTINGS,
  );

  const currentAiChatThread = useAtomStateValue(currentAiChatThreadState);
  const setCurrentAiChatThread = useSetAtomState(currentAiChatThreadState);
  const setAgentChatInput = useSetAtomState(agentChatInputState);
  const setAgentChatThreadsLoading = useSetAtomState(
    agentChatThreadsLoadingState,
  );
  const agentChatThreadsLoading = useAtomStateValue(
    agentChatThreadsLoadingState,
  );
  const threadTitleFamilyCallback = useAtomComponentFamilyStateCallbackState(
    currentAiChatThreadTitleComponentFamilyState,
  );
  const agentChatUsageFamilyCallback = useAtomComponentFamilyStateCallbackState(
    agentChatUsageComponentFamilyState,
  );
  const store = useStore();
  const agentChatVisibleThreads = useAtomStateValue(
    agentChatVisibleThreadsSelector,
  );
  const [hasInitializedAgentChatThreads, setHasInitializedAgentChatThreads] =
    useAtomState(hasInitializedAgentChatThreadsState);

  useEffect(() => {
    if (!hasAiSettingsPermission) {
      return;
    }

    setAgentChatThreadsLoading(true);

    client
      .query({
        query: GetChatThreadsDocument,
        fetchPolicy: 'network-only',
      })
      .then((result) => {
        if (!isDefined(result.data?.chatThreads)) {
          return;
        }

        replaceDraft('agentChatThreads', result.data.chatThreads);
        applyChanges();

        const activeThreadId = store.get(currentAiChatThreadState.atom);
        const serverThreadIds = new Set(
          result.data.chatThreads.map((thread) => thread.id),
        );

        if (
          isDefined(activeThreadId) &&
          isValidUuid(activeThreadId) &&
          !serverThreadIds.has(activeThreadId)
        ) {
          setCurrentAiChatThread(AGENT_CHAT_NEW_THREAD_DRAFT_KEY);
        }
      })
      .finally(() => {
        setAgentChatThreadsLoading(false);
      });
  }, [
    hasAiSettingsPermission,
    client,
    replaceDraft,
    applyChanges,
    setAgentChatThreadsLoading,
    store,
    setCurrentAiChatThread,
  ]);

  useEffect(() => {
    if (
      hasInitializedAgentChatThreads ||
      (currentAiChatThread !== null && isValidUuid(currentAiChatThread))
    ) {
      return;
    }

    if (!hasAiSettingsPermission) {
      return;
    }

    if (agentChatThreadsLoading) {
      return;
    }

    setHasInitializedAgentChatThreads(true);

    const sortedThreads = sortChatThreadsByLastActivityDesc(
      agentChatVisibleThreads,
    );

    if (sortedThreads.length > 0) {
      const firstThread = sortedThreads[0];
      const draftForThread =
        store.get(agentChatDraftsByThreadIdState.atom)[firstThread.id] ?? '';

      setCurrentAiChatThread(firstThread.id);
      setAgentChatInput(draftForThread);

      const firstThreadFamilyKey = { threadId: firstThread.id };

      store.set(
        threadTitleFamilyCallback(firstThreadFamilyKey),
        firstThread.title ?? null,
      );

      const hasUsageData =
        (firstThread.conversationSize ?? 0) > 0 &&
        isDefined(firstThread.contextWindowTokens);

      store.set(
        agentChatUsageFamilyCallback(firstThreadFamilyKey),
        hasUsageData
          ? {
              lastMessage: null,
              conversationSize: firstThread.conversationSize ?? 0,
              contextWindowTokens: firstThread.contextWindowTokens ?? 0,
              inputTokens: firstThread.totalInputTokens,
              outputTokens: firstThread.totalOutputTokens,
              inputCredits: firstThread.totalInputCredits,
              outputCredits: firstThread.totalOutputCredits,
            }
          : null,
      );
    } else {
      store.set(hasTriggeredCreateForDraftState.atom, false);
      setCurrentAiChatThread(AGENT_CHAT_NEW_THREAD_DRAFT_KEY);
      setAgentChatInput(
        store.get(agentChatDraftsByThreadIdState.atom)[
          AGENT_CHAT_NEW_THREAD_DRAFT_KEY
        ] ?? '',
      );
    }
  }, [
    agentChatVisibleThreads,
    currentAiChatThread,
    hasAiSettingsPermission,
    hasInitializedAgentChatThreads,
    agentChatThreadsLoading,
    setHasInitializedAgentChatThreads,
    setCurrentAiChatThread,
    setAgentChatInput,
    store,
    threadTitleFamilyCallback,
    agentChatUsageFamilyCallback,
  ]);

  return null;
};
