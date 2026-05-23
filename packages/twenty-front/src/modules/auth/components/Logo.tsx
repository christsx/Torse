import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { AppPath } from 'twenty-shared/types';
import { getImageAbsoluteURI, isDefined } from 'twenty-shared/utils';
import { Avatar } from 'twenty-ui/display';
import { UndecoratedLink } from 'twenty-ui/navigation';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import {
  PRODUCT_LOGO_PATH,
  PRODUCT_NAME,
} from '~/constants/product-branding.constants';
import { useRedirectToDefaultDomain } from '~/modules/domain-manager/hooks/useRedirectToDefaultDomain';

type LogoProps = {
  primaryLogo?: string | null;
  secondaryLogo?: string | null;
  placeholder?: string | null;
  onClick?: () => void;
};

const StyledContainer = styled.div`
  height: ${themeCssVariables.spacing[12]};
  margin-bottom: ${themeCssVariables.spacing[4]};
  margin-top: ${themeCssVariables.spacing[4]};
  position: relative;
  width: ${themeCssVariables.spacing[12]};
`;

const StyledDefaultLogoFrame = styled.div`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
`;

const StyledPrimaryLogoImage = styled.img<{ $isDefaultLogo?: boolean }>`
  border-radius: ${({ $isDefaultLogo }) =>
    $isDefaultLogo ? themeCssVariables.border.radius.sm : '0'};
  display: block;
  height: 100%;
  object-fit: ${({ $isDefaultLogo }) => ($isDefaultLogo ? 'contain' : 'cover')};
  object-position: center;
  width: 100%;
`;

const StyledLogoLinkWrapper = styled.div`
  display: block;
  height: 100%;
  width: 100%;

  a {
    display: block;
    height: 100%;
    width: 100%;
  }
`;

const StyledSecondaryLogo = styled.img`
  border-radius: ${themeCssVariables.border.radius.xs};
  height: ${themeCssVariables.spacing[6]};
  width: ${themeCssVariables.spacing[6]};
`;

const StyledSecondaryLogoContainer = styled.div`
  align-items: center;
  background-color: ${themeCssVariables.background.primary};
  border-radius: ${themeCssVariables.border.radius.sm};
  bottom: calc(-1 * ${themeCssVariables.spacing[3]});
  display: flex;
  height: ${themeCssVariables.spacing[7]};
  justify-content: center;
  position: absolute;
  right: calc(-1 * ${themeCssVariables.spacing[3]});
  width: ${themeCssVariables.spacing[7]};
`;

export const Logo = ({
  primaryLogo,
  secondaryLogo,
  placeholder,
  onClick,
}: LogoProps) => {
  const { redirectToDefaultDomain } = useRedirectToDefaultDomain();
  const isUsingDefaultLogo = !isDefined(primaryLogo);

  const primaryLogoUrl = isUsingDefaultLogo
    ? PRODUCT_LOGO_PATH
    : getImageAbsoluteURI({
        imageUrl: primaryLogo,
        baseUrl: REACT_APP_SERVER_BASE_URL,
      });

  const secondaryLogoUrl = isNonEmptyString(secondaryLogo)
    ? getImageAbsoluteURI({
        imageUrl: secondaryLogo,
        baseUrl: REACT_APP_SERVER_BASE_URL,
      })
    : null;

  const primaryLogoImage = isUsingDefaultLogo ? (
    <StyledDefaultLogoFrame>
      <StyledPrimaryLogoImage
        src={primaryLogoUrl}
        alt={PRODUCT_NAME}
        draggable={false}
        $isDefaultLogo
      />
    </StyledDefaultLogoFrame>
  ) : (
    <StyledPrimaryLogoImage
      src={primaryLogoUrl}
      alt={PRODUCT_NAME}
      draggable={false}
    />
  );

  return (
    <StyledContainer onClick={() => onClick?.()}>
      {isUsingDefaultLogo ? (
        <StyledLogoLinkWrapper>
          <UndecoratedLink
            to={AppPath.SignInUp}
            onClick={redirectToDefaultDomain}
          >
            {primaryLogoImage}
          </UndecoratedLink>
        </StyledLogoLinkWrapper>
      ) : (
        primaryLogoImage
      )}
      {isDefined(secondaryLogoUrl) ? (
        <StyledSecondaryLogoContainer>
          <StyledSecondaryLogo src={secondaryLogoUrl} alt="" />
        </StyledSecondaryLogoContainer>
      ) : (
        isDefined(placeholder) && (
          <StyledSecondaryLogoContainer>
            <Avatar
              size="lg"
              placeholder={placeholder}
              type="squared"
              placeholderColorSeed={placeholder}
            />
          </StyledSecondaryLogoContainer>
        )
      )}
    </StyledContainer>
  );
};
